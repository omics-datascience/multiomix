import logging
import os.path
import tarfile
import tempfile
import pandas as pd
from os import listdir
from os.path import isfile
from typing import List, Optional
from urllib.parse import urlparse
from django.utils import timezone
from pymongo.errors import InvalidName
from api_service.mongo_service import global_mongo_service, MOLECULE_SYMBOL
from common.constants import PATIENT_ID_COLUMN, TCGA_CONVENTION, SAMPLE_ID_COLUMN
from common.datasets_utils import clean_dataset
from common.exceptions import ExperimentStopped
from common.functions import check_if_stopped
from common.typing import AbortEvent
from user_files.models_choices import FileType
from .models import CGDSStudy, CGDSDataset, CGDSDatasetSynchronizationState

# Prefix to concatenate to MongoDB collection names
VERSION_PREFIX = '_version_'


class SkipRowsIsIncorrect(Exception):
    """Raised when the Pandas "skiprows" parameter is incorrect"""
    pass


def __get_files_of_directory(dir_path: str) -> List[str]:
    """
    Gets a list of files (excludes directories) of a specific directory path.
    @param dir_path: Directory path to check.
    @return: List of file names in the directory.
    """
    return sorted([filename for filename in listdir(dir_path) if isfile(os.path.join(dir_path, filename))])


def __sync_dataset(dataset: CGDSDataset, extract_path: str, only_failed: bool,
                   check_patient_column: bool, is_aborted: AbortEvent):
    """
    Synchronizes a CGDS Dataset from a compressed file downloaded in 'sync_study' method.
    @param dataset: Dataset to synchronize.
    @param extract_path: System path where the extracted files will be temporarily stored.
    @param only_failed: If True, only synchronizes the dataset if It's not synchronized yet.
    @param check_patient_column: If True it checks that the patient id column is present (useful for clinical).
    @param is_aborted: AbortEvent to check if the process was aborted.
    """
    check_if_stopped(is_aborted, ExperimentStopped)
    if dataset is not None:
        # Checks if the dataset is already synchronized
        if only_failed and dataset.state == CGDSDatasetSynchronizationState.SUCCESS:
            logging.warning(f'Dataset "{dataset}" is already synchronized and only_failed is True. Ignoring it.')
            return

        # Gets file
        check_if_stopped(is_aborted, ExperimentStopped)
        dataset_file_path = os.path.join(extract_path, dataset.file_path)
        skip_rows = dataset.header_row_index if dataset.header_row_index else 0

        dataset_content: Optional[pd.DataFrame] = None
        sync_went_fine = False
        try:
            check_if_stopped(is_aborted, ExperimentStopped)
            dataset_content = pd.read_csv(
                dataset_file_path,
                sep=dataset.separator,
                skiprows=skip_rows
            )

            # Checks, in case of clinical datasets that PATIENT_ID_COLUMN is present
            if check_patient_column and PATIENT_ID_COLUMN not in dataset_content.columns:
                raise SkipRowsIsIncorrect

            # Replaces '.' with '_dot_' to prevent MongoDB errors
            check_if_stopped(is_aborted, ExperimentStopped)
            dataset_content.columns = dataset_content.columns.str.replace(".", "_dot_")

            # Replaces TCGA suffix: '-01' (primary tumor), -06 (metastatic) and '-11' (normal) from samples
            # to avoid breaking df join. There's also '-03' suffix in some Firehose Legacy studies
            check_if_stopped(is_aborted, ExperimentStopped)
            if dataset.file_type == FileType.CLINICAL:
                # Clinical data has a PATIENT_ID or SAMPLE_ID column. In the samples file (data_clinical_sample.txt)
                # there is a SAMPLE_ID column that has the TCGA suffix. In the patients file
                # (data_clinical_patient.txt) there's not, so we have to check if it's that file and replaces the
                # suffix in the PATIENT_ID column
                if SAMPLE_ID_COLUMN in dataset_content.columns and PATIENT_ID_COLUMN in dataset_content.columns:
                    dataset_content[PATIENT_ID_COLUMN] = dataset_content[PATIENT_ID_COLUMN].str.replace(
                        TCGA_CONVENTION, '', regex=True
                    )
            else:
                # Samples in molecules datasets are in the header (as columns)
                dataset_content.columns = dataset_content.columns.str.replace(TCGA_CONVENTION, '', regex=True)

                # Removes the duplicated molecules (if any). This is necessary because some datasets have
                # duplicated due to discontinued molecules identifiers.
                # First, generates a column with all the values of the MOLECULE_SYMBOL column as upper case as
                # cBioPortal contains some duplicated identifiers in different cases (upper and lower)
                check_if_stopped(is_aborted, ExperimentStopped)
                upper_col = f'{MOLECULE_SYMBOL}_upper'
                dataset_content[upper_col] = dataset_content[MOLECULE_SYMBOL].str.upper()

                # Removes duplicated molecules and the generated column
                check_if_stopped(is_aborted, ExperimentStopped)
                dataset_content = dataset_content.drop_duplicates(subset=[upper_col], keep=False)
                dataset_content = dataset_content.drop(columns=[upper_col])

                # Removes NaNs values to prevent errors in JSON sent to BioAPI/Modulector
                check_if_stopped(is_aborted, ExperimentStopped)
                dataset_content = clean_dataset(dataset_content, axis='index')

            # Removes the collection
            check_if_stopped(is_aborted, ExperimentStopped)
            global_mongo_service.drop_collection(dataset.mongo_collection_name)

            # Inserts the documents in the collection
            check_if_stopped(is_aborted, ExperimentStopped)
            inserted_successfully = global_mongo_service.insert_cgds_dataset(
                dataset_content,
                dataset.mongo_collection_name,
                dataset.file_type
            )

            # If everything goes well, change the dataset info
            check_if_stopped(is_aborted, ExperimentStopped)
            dataset.date_last_synchronization = timezone.now()
            if inserted_successfully:
                dataset.state = CGDSDatasetSynchronizationState.SUCCESS
                sync_went_fine = True
            else:
                dataset.state = CGDSDatasetSynchronizationState.COULD_NOT_SAVE_IN_MONGO
        except SkipRowsIsIncorrect:
            columns = dataset_content.columns.tolist() if dataset_content else []
            logging.error(f"The dataset '{dataset}' seems to have an invalid skiprows parameter as it does not "
                          f"contains '{PATIENT_ID_COLUMN}' column. Columns with current skiprows "
                          f"value ({dataset.header_row_index}) are: {columns}")
            dataset.state = CGDSDatasetSynchronizationState.NO_PATIENT_ID_COLUMN_FOUND
        except InvalidName:
            logging.error(f"The dataset '{dataset}' has an invalid MongoDB collection's name")
            dataset.state = CGDSDatasetSynchronizationState.COULD_NOT_SAVE_IN_MONGO
        except FileNotFoundError:
            logging.error(f"The file '{dataset.file_path}' does not exist in the tar.gz of the dataset '{dataset}'")
            logging.error(f'Possible files to select in dataset: {__get_files_of_directory(extract_path)}')
            dataset.state = CGDSDatasetSynchronizationState.FILE_DOES_NOT_EXIST
        except Exception as e:
            logging.error(
                f"The CGDS dataset '{dataset}' had a sync problem: {e}"
            )
            logging.exception(e)
            dataset.state = CGDSDatasetSynchronizationState.FINISHED_WITH_ERROR

        # Saves changes in the DB
        dataset.save()

        # If everything is ok, computes some others fields
        if sync_went_fine:
            dataset.compute_post_saved_field()
        else:
            # Raises an Exception to stop the CGDSStudy synchronization process
            msg = f'The dataset {dataset} had a sync problem. Stopping the CGDSStudy synchronization process'
            logging.error(msg)
            raise Exception(msg)


def __detect_sub_folder(dir_path: str) -> Optional[str]:
    """
    Detects if there is a sub folder and not files in a specific directory path. This prevents errors
    on CGDS studies which has a sub folder in its tar.gz file
    @param dir_path: Directory path to check
    @return: The name of sub folder if detected, None otherwise
    """
    there_are_files = False
    directory: Optional[str] = None
    for filename in listdir(dir_path):
        if isfile(os.path.join(dir_path, filename)):
            there_are_files = True
        elif directory is None:
            directory = filename

        if directory is not None and there_are_files:
            # In this case it has all the needed information
            break

    if directory is not None and not there_are_files:
        return directory
    return None


def __copy_dataset(dataset: Optional[CGDSDataset], new_version: int,
                   copy_survival_tuples: bool = False) -> Optional[CGDSDataset]:
    """
    Generates a copy of a CGDSDataset with a new collection name.
    @param dataset: CGDSDataset instance to copy.
    @param new_version: New version to concatenate to the collection name.
    @param copy_survival_tuples: If True, copies the SurvivalTuple instances related to the dataset (useful for
    cBioPortal Clinical Patients dataset).
    @return: A copy of the CGDSDataset instance.
    """
    if dataset is None:
        return None

    # NOTE: persists as list to prevent lazy evaluation returning 0 elements when copy the instance
    survival_columns = list(dataset.survival_columns.all()) if copy_survival_tuples else None
    dataset_copy = dataset
    dataset_copy.pk = None

    # Generates a new MongoDB collection name
    original_mongo_collection: str = dataset_copy.mongo_collection_name
    split_res = original_mongo_collection.rsplit(VERSION_PREFIX, maxsplit=1)

    # If no version tag is present in the collection name, adds the new version
    if len(split_res) < 2:
        mongo_collection_name = f"{original_mongo_collection}{VERSION_PREFIX}{new_version}"
    else:
        # If there's a split result, checks that it corresponds to the version tag
        mongo_collection_without_version, old_version_tag = split_res

        # If there's an old version tag in the collection name, replaces it with the new version
        if old_version_tag.isnumeric():
            mongo_collection_name = f"{mongo_collection_without_version}{VERSION_PREFIX}{new_version}"
        else:
            # Otherwise, adds the new version to the original name
            mongo_collection_name = f"{original_mongo_collection}{VERSION_PREFIX}{new_version}"

    dataset_copy.mongo_collection_name = mongo_collection_name
    dataset_copy.state = CGDSDatasetSynchronizationState.NOT_SYNCHRONIZED

    # Saves the copy to add survival columns (if needed)
    dataset_copy.save()

    # Copies the survival tuples if needed
    if survival_columns is not None:
        for survival_tuple in survival_columns:
            survival_tuple.pk = None
            survival_tuple.clinical_dataset = dataset_copy
            survival_tuple.save()

    return dataset_copy


def generate_study_new_version(study: CGDSStudy) -> CGDSStudy:
    """Generates a copy of a CGDSStudy and all its CGDSDatasets with a new version number."""
    # Creates a copy of study
    study_copy = study
    study_copy.pk = None

    # Updates version
    new_version = study.get_last_version() + 1
    study_copy.version = new_version

    # Removes also the date of last synchronization
    study_copy.date_last_synchronization = None

    # Creates a copy of its datasets and edits the collection name to prevent conflicts
    study_copy.mrna_dataset = __copy_dataset(study.mrna_dataset, new_version)
    study_copy.mirna_dataset = __copy_dataset(study.mirna_dataset, new_version)
    study_copy.cna_dataset = __copy_dataset(study.cna_dataset, new_version)
    study_copy.methylation_dataset = __copy_dataset(study.methylation_dataset, new_version)
    study_copy.clinical_patient_dataset = __copy_dataset(study.clinical_patient_dataset, new_version,
                                                         copy_survival_tuples=True)
    study_copy.clinical_sample_dataset = __copy_dataset(study.clinical_sample_dataset, new_version)

    # Saves changes
    study_copy.save()

    return study_copy


def extract_file_and_sync_datasets(cgds_study: CGDSStudy, tar_file_path: str, only_failed: bool,
                                   is_aborted: AbortEvent):
    """
    Extracts the recently downloaded tar file of a CGDSStudy and syncs its CGDSDataset which
    are inside the tar file
    @param cgds_study: CGDSStudy to gets the reading mode of the tar file
    @param tar_file_path: Path of downloaded tar file to decompress it
    @param only_failed: If True, only synchronizes the datasets that are not synchronized yet.
    @param is_aborted: AbortEvent to check if the process was aborted.
    """
    # Infers the mode of downloaded compressed file to open it
    check_if_stopped(is_aborted, ExperimentStopped)
    path = urlparse(cgds_study.url).path
    ext = os.path.splitext(path)[1]
    mode = "r:gz" if ext == ".gz" else "r:"

    # Creates a temp dir
    with tempfile.TemporaryDirectory() as extract_path:
        # Open the tar/tar.gz file into the temp dir
        check_if_stopped(is_aborted, ExperimentStopped)
        with tarfile.open(tar_file_path, mode) as downloaded_tar_file:
            downloaded_tar_file.extractall(extract_path)

        # Checks if there is a sub folder and concatenates its name
        check_if_stopped(is_aborted, ExperimentStopped)
        sub_folder_name = __detect_sub_folder(extract_path)
        if sub_folder_name is not None:
            extract_path = os.path.join(extract_path, sub_folder_name)

        # Syncs CGDS study's datasets
        __sync_dataset(cgds_study.mrna_dataset, extract_path, only_failed, check_patient_column=False,
                       is_aborted=is_aborted)
        __sync_dataset(cgds_study.mirna_dataset, extract_path, only_failed, check_patient_column=False,
                       is_aborted=is_aborted)
        __sync_dataset(cgds_study.cna_dataset, extract_path, only_failed, check_patient_column=False,
                       is_aborted=is_aborted)
        __sync_dataset(cgds_study.methylation_dataset, extract_path, only_failed, check_patient_column=False,
                       is_aborted=is_aborted)
        __sync_dataset(cgds_study.clinical_patient_dataset, extract_path, only_failed,
                       check_patient_column=True, is_aborted=is_aborted)
        __sync_dataset(cgds_study.clinical_sample_dataset, extract_path, only_failed,
                       check_patient_column=True, is_aborted=is_aborted)


def all_dataset_finished_correctly(cgds_study: CGDSStudy) -> bool:
    """
    Returns True if all the datasets were correctly imported.
    @param cgds_study: CGDSStudy instance to get its CGDSDatasets.
    @return: True if all the datasets were correctly imported, False otherwise.
    """
    for dataset in cgds_study.get_all_valid_datasets():
        if dataset.state not in [CGDSDatasetSynchronizationState.SUCCESS,
                                 CGDSDatasetSynchronizationState.NOT_SYNCHRONIZED]:
            return False

    return True
