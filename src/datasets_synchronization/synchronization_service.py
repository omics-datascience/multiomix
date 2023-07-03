from typing import List, Optional
from os import listdir
from os.path import isfile
from django.utils import timezone
from urllib.error import URLError
import requests
from pymongo.errors import InvalidName
from requests.exceptions import ConnectionError
from common.constants import PATIENT_ID_COLUMN, TCGA_CONVENTION, SAMPLE_ID_COLUMN
from common.datasets_utils import clean_dataset
from common.functions import close_db_connection
from user_files.models_choices import FileType
from .enums import SyncStrategy
from .models import CGDSStudy, CGDSDataset, CGDSStudySynchronizationState, CGDSDatasetSynchronizationState
from concurrent.futures import ThreadPoolExecutor
import tarfile
import tempfile
import pandas as pd
from api_service.mongo_service import global_mongo_service, MOLECULE_SYMBOL
import logging
from urllib.parse import urlparse
import os.path
from django.conf import settings


# Prefix to concatenate to MongoDB collection names
VERSION_PREFIX = '_version_'


class SkipRowsIsIncorrect(Exception):
    """Raised when the Pandas "skiprows" parameter is incorrect"""
    pass


class SynchronizationService:
    """Manages CGDS Studies with their Datasets synchronization in a ThreadPool"""
    executor: ThreadPoolExecutor = None  # Future executor to execute tasks

    def __init__(self):
        # Instantiates the executor
        # IMPORTANT: ProcessPoolExecutor doesn't work well with Channels. It wasn't sending
        # websocket messages by some weird reason that I couldn't figure out. Let's use Threads instead of
        # processes
        self.executor = ThreadPoolExecutor(max_workers=5)

    @staticmethod
    def __get_files_of_directory(dir_path: str) -> List[str]:
        """
        Gets a list of files (excludes directories) of a specific directory path.
        @param dir_path: Directory path to check.
        @return: List of file names in the directory.
        """
        return sorted([filename for filename in listdir(dir_path) if isfile(os.path.join(dir_path, filename))])

    def __sync_dataset(self, dataset: CGDSDataset, extract_path: str, only_failed: bool,
                       check_patient_column: bool):
        """
        Synchronizes a CGDS Dataset from a compressed file downloaded in 'sync_study' method.
        @param dataset: Dataset to synchronize.
        @param extract_path: System path where the extracted files will be temporarily stored.
        @param only_failed: If True, only synchronizes the dataset if It's not synchronized yet.
        @param check_patient_column: If True it checks that the patient id column is present (useful for clinical).
        """
        if dataset is not None:
            # Checks if the dataset is already synchronized
            if only_failed and dataset.state == CGDSDatasetSynchronizationState.SUCCESS:
                logging.warning(f'Dataset "{dataset}" is already synchronized and only_failed is True. Ignoring it.')
                return

            # Gets file
            dataset_file_path = os.path.join(extract_path, dataset.file_path)
            skip_rows = dataset.header_row_index if dataset.header_row_index else 0

            dataset_content: Optional[pd.DataFrame] = None
            sync_went_fine = False
            try:
                dataset_content = pd.read_csv(
                    dataset_file_path,
                    sep=dataset.separator,
                    skiprows=skip_rows
                )

                # Checks, in case of clinical datasets that PATIENT_ID_COLUMN is present
                if check_patient_column and PATIENT_ID_COLUMN not in dataset_content.columns:
                    raise SkipRowsIsIncorrect

                # Replaces '.' with '_dot_' to prevent MongoDB errors
                dataset_content.columns = dataset_content.columns.str.replace(".", "_dot_")

                # Replaces TCGA suffix: '-01' (primary tumor), -06 (metastatic) and '-11' (normal) from samples
                # to avoid breaking df join
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
                    upper_col = f'{MOLECULE_SYMBOL}_upper'
                    dataset_content[upper_col] = dataset_content[MOLECULE_SYMBOL].str.upper()

                    # Removes duplicated molecules and the generated column
                    dataset_content = dataset_content.drop_duplicates(subset=[upper_col], keep=False)
                    dataset_content = dataset_content.drop(columns=[upper_col])

                    # Removes NaNs values to prevent errors in JSON sent to BioAPI/Modulector
                    dataset_content = clean_dataset(dataset_content, axis='index')

                # Removes the collection
                global_mongo_service.drop_collection(dataset.mongo_collection_name)

                # Inserts the documents in the collection
                inserted_successfully = global_mongo_service.insert_cgds_dataset(
                    dataset_content,
                    dataset.mongo_collection_name,
                    dataset.file_type
                )

                # If everything goes well, change the dataset info
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
                logging.error(f'Possible files to select in dataset: {self.__get_files_of_directory(extract_path)}')
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

    @staticmethod
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

    @staticmethod
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

    def generate_study_new_version(self, study: CGDSStudy) -> CGDSStudy:
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
        study_copy.mrna_dataset = self.__copy_dataset(study.mrna_dataset, new_version)
        study_copy.mirna_dataset = self.__copy_dataset(study.mirna_dataset, new_version)
        study_copy.cna_dataset = self.__copy_dataset(study.cna_dataset, new_version)
        study_copy.methylation_dataset = self.__copy_dataset(study.methylation_dataset, new_version)
        study_copy.clinical_patient_dataset = self.__copy_dataset(study.clinical_patient_dataset, new_version,
                                                                  copy_survival_tuples=True)
        study_copy.clinical_sample_dataset = self.__copy_dataset(study.clinical_sample_dataset, new_version)

        # Saves changes
        study_copy.save()

        return study_copy

    def extract_file_and_sync_datasets(self, cgds_study: CGDSStudy, tar_file_path: str, only_failed: bool):
        """
        Extracts the recently downloaded tar file of a CGDSStudy and syncs its CGDSDataset which
        are inside the tar file
        @param cgds_study: CGDSStudy to gets the reading mode of the tar file
        @param tar_file_path: Path of downloaded tar file to decompress it
        @param only_failed: If True, only synchronizes the datasets that are not synchronized yet.
        """
        # Infers the mode of downloaded compressed file to open it
        path = urlparse(cgds_study.url).path
        ext = os.path.splitext(path)[1]
        mode = "r:gz" if ext == ".gz" else "r:"

        # Creates a temp dir
        with tempfile.TemporaryDirectory() as extract_path:
            # Open the tar/tar.gz file into the temp dir
            with tarfile.open(tar_file_path, mode) as downloaded_tar_file:
                downloaded_tar_file.extractall(extract_path)

            # Checks if there is a sub folder and concatenates its name
            sub_folder_name = self.__detect_sub_folder(extract_path)
            if sub_folder_name is not None:
                extract_path = os.path.join(extract_path, sub_folder_name)

            # Syncs CGDS study's datasets
            self.__sync_dataset(cgds_study.mrna_dataset, extract_path, only_failed, check_patient_column=False)
            self.__sync_dataset(cgds_study.mirna_dataset, extract_path, only_failed, check_patient_column=False)
            self.__sync_dataset(cgds_study.cna_dataset, extract_path, only_failed, check_patient_column=False)
            self.__sync_dataset(cgds_study.methylation_dataset, extract_path, only_failed, check_patient_column=False)
            self.__sync_dataset(cgds_study.clinical_patient_dataset, extract_path, only_failed,
                                check_patient_column=True)
            self.__sync_dataset(cgds_study.clinical_sample_dataset, extract_path, only_failed,
                                check_patient_column=True)

    @staticmethod
    def __all_dataset_finished_correctly(cgds_study: CGDSStudy) -> bool:
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

    def sync_study(self, cgds_study: CGDSStudy, only_failed: bool):
        """
        Synchronizes a CGDS Study from CBioportal (https://www.cbioportal.org/)
        @param cgds_study: CGDS Study to synchronize
        @param only_failed: If True, only synchronizes the datasets that are not synchronized yet.
        """
        # Updates the CGDS Study state
        cgds_study.state = CGDSStudySynchronizationState.IN_PROCESS
        cgds_study.save(update_fields=['state'])

        # Gets the tar.gz file
        try:
            # Downloads the file in a temporary file
            logging.warning(f'Starting {cgds_study.name} downloading')
            with tempfile.NamedTemporaryFile(mode='wb') as out_file:
                downloaded_path = out_file.name

                # Sets the variables to logs the download progress
                connection_timeout = float(settings.CGDS_CONNECTION_TIMEOUT)
                read_timeout = float(settings.CGDS_READ_TIMEOUT)
                req = requests.get(cgds_study.url, stream=True, timeout=(connection_timeout, read_timeout))
                size = int(req.headers['Content-Length'].strip())
                downloaded_bytes = 0

                # Reads in chunks and logs the progress
                chunk_size = int(settings.CGDS_CHUNK_SIZE)
                for chunk in req.iter_content(chunk_size=chunk_size):
                    out_file.write(chunk)

                    # Logs the progress status
                    downloaded_bytes += len(chunk)
                    downloaded_bytes_percentage = (100 * downloaded_bytes) // size
                    logging.warning(f'{cgds_study.name} downloaded at -> {downloaded_bytes_percentage}%')

                logging.warning(f'{cgds_study.name} downloading finished')

                # Extracts and synchronizes the CGDSStudy's Datasets
                self.extract_file_and_sync_datasets(cgds_study, downloaded_path, only_failed)

            # Saves new state of the CGDSStudy
            if self.__all_dataset_finished_correctly(cgds_study):
                cgds_study.state = CGDSStudySynchronizationState.COMPLETED
                cgds_study.date_last_synchronization = timezone.now()
            else:
                cgds_study.state = CGDSStudySynchronizationState.FINISHED_WITH_ERROR
        except (ConnectionError, URLError, ValueError) as e:
            logging.error(f'The URL {cgds_study.url} of study with pk {cgds_study.pk} was not found: {e}')
            cgds_study.state = CGDSStudySynchronizationState.URL_ERROR
        except tarfile.ReadError as e:
            logging.error(f'Error reading {cgds_study}: {e}')
            cgds_study.state = CGDSStudySynchronizationState.FINISHED_WITH_ERROR
        except requests.exceptions.ConnectTimeout as e:
            logging.error(f'Connection timeout error downloading {cgds_study}: {e}')
            cgds_study.state = CGDSStudySynchronizationState.CONNECTION_TIMEOUT_ERROR
        except requests.exceptions.ReadTimeout as e:
            logging.error(f'Read timeout error downloading {cgds_study}: {e}')
            cgds_study.state = CGDSStudySynchronizationState.READ_TIMEOUT_ERROR
        except Exception as e:
            logging.error(
                f"The CGDS Study '{cgds_study}' had a sync problem: {e}"
            )
            logging.exception(e)
            cgds_study.state = CGDSStudySynchronizationState.FINISHED_WITH_ERROR

        # Saves changes in the DB
        cgds_study.save()

        # Closes DB connections due to be in a ThreadPool
        close_db_connection()
        global_mongo_service.close_mongo_db_connection()

    def add_cgds_study(self, cgds_study: CGDSStudy, sync_strategy: SyncStrategy):
        """
        Adds an CGDS Study to the ThreadPool to be processed.
        @param cgds_study: CGDSStudy to be processed.
        @param sync_strategy: Sync strategy.
        version will be updated (useful for studies with critical errors).
        """
        # First of all checks if exists at least one CGDS dataset with a success state
        if sync_strategy == SyncStrategy.NEW_VERSION and cgds_study.has_at_least_one_dataset_synchronized():
            logging.info(f'CGDS Study {cgds_study.name} has at least one dataset synchronized. '
                         f'Generating a new version...')
            cgds_study = self.generate_study_new_version(cgds_study)

        # Updates the state
        cgds_study.state = CGDSStudySynchronizationState.WAITING_FOR_QUEUE
        cgds_study.save(update_fields=['state'])

        only_failed = sync_strategy == SyncStrategy.SYNC_ONLY_FAILED
        self.executor.submit(self.sync_study, cgds_study, only_failed)


global_synchronization_service = SynchronizationService()
