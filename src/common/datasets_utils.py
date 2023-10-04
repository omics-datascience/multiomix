import os
import tempfile
import numpy as np
from typing import Union, Optional, cast, List, Literal, Tuple, Any
import pandas as pd
from api_service.models import ExperimentSource
from common.exceptions import NoSamplesInCommon, NumberOfSamplesFewerThanCVFolds, NoValidMolecules, NoValidSamples
from datasets_synchronization.models import SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleUserFile
from feature_selection.fs_algorithms import SurvModel
from feature_selection.models import FSExperiment, TrainedModel
from inferences.models import InferenceExperiment
from statistical_properties.models import StatisticalValidation
from user_files.models_choices import FileType

# Axis to remove invalid values from Pandas DataFrames
Axis = Literal['index', 'columns']

# Common event values
COMMON_INTEREST_VALUES = ['DEAD', 'DECEASE', 'DEATH']

ExperimentObjType = Union[FSExperiment, InferenceExperiment, StatisticalValidation, TrainedModel]


def create_folder_with_permissions(dir_path: str):
    """Creates (if not exist) a folder and assigns permissions to work without problems in the Spark container."""
    # First, checks if the folder exists
    if os.path.exists(dir_path):
        return

    mode = 0o777
    os.mkdir(dir_path, mode)
    os.chmod(dir_path, mode)  # Mode in mkdir is sometimes ignored: https://stackoverflow.com/a/5231994/7058363


def get_samples_intersection(source: ExperimentSource, last_intersection: np.ndarray) -> np.ndarray:
    """
    Gets the intersection of the samples of the current source with the last intersection.
    @param source: Source to get the samples from.
    @param last_intersection: Last intersection of samples.
    @return: Intersection of the samples of the current source with the last intersection.
    """
    # Clean all the samples name to prevent issues with CGDS suffix
    current_samples = source.get_samples()

    if last_intersection is not None:
        cur_intersection = np.intersect1d(
            last_intersection,
            current_samples
        )
    else:
        cur_intersection = np.array(current_samples)
    last_intersection = cast(np.ndarray, cur_intersection)
    return last_intersection


def get_common_samples(experiment: ExperimentObjType) -> np.ndarray:
    """
    Gets a sorted Numpy array with the samples ID in common between both ExperimentSources.
    @param experiment: Feature Selection experiment.
    @return: Sorted Numpy array with the samples in common
    """
    # NOTE: the intersection is already sorted by Numpy
    last_intersection: Optional[np.ndarray] = None

    for source in experiment.get_all_sources():
        if source is None:
            continue

        last_intersection = get_samples_intersection(source, last_intersection)

    # Checks empty intersection
    last_intersection = cast(np.ndarray, last_intersection)
    if last_intersection.size == 0:
        raise NoSamplesInCommon

    return last_intersection


def __process_chunk(chunk: pd.DataFrame, file_type: FileType, molecules: List[str],
                    samples_in_common: np.ndarray) -> pd.DataFrame:
    """Processes a chunk of a DataFrame adding the file type to the index and keeping just the samples in common."""
    # Only keeps the samples in common
    chunk = chunk[samples_in_common]

    # Keeps only existing molecules in the current chunk
    molecules_to_extract = np.intersect1d(chunk.index, molecules)
    chunk = chunk.loc[molecules_to_extract]

    # Adds type to disambiguate between genes of 'mRNA' type and 'CNA' type
    chunk.index = chunk.index + f'_{file_type}'

    return chunk


def __is_numerical(value: Any) -> bool:
    """Checks if a value is numerical. Taken from https://stackoverflow.com/a/23639915/7058363."""
    res = isinstance(value, (int, float)) or (isinstance(value, str) and value.replace('.', '', 1).isdigit())
    return res


def generate_clinical_file(experiment: ExperimentObjType, samples_in_common: np.ndarray,
                           survival_tuple: Union[SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleUserFile]) -> str:
    """
    Generates the clinical DataFrame for a specific instance with the samples in common and saves it in disk.
    @param experiment: Instance to get the sources from.
    @param samples_in_common: Samples in common between all the sources.
    @param survival_tuple: Tuple with the event and time column names to retrieve.
    @return: Clinical file path saved in disk.
    """
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
        clinical_temp_file_path = temp_file.name

        # Gets DataFrame
        clinical_source = experiment.clinical_source
        clinical_df: pd.DataFrame = clinical_source.get_df()

        event_column = survival_tuple.event_column
        time_column = survival_tuple.time_column

        # Keeps only the survival tuple and samples in common
        clinical_df = clinical_df[[event_column, time_column]]
        clinical_df = clinical_df.loc[samples_in_common]

        # Replaces str values of CGDS for booleans values
        clinical_df[event_column] = clinical_df[event_column].apply(
            replace_event_col_for_booleans
        )

        # Cast time column to numerical and removes invalid rows.
        # cBioPortal datasets have some studies with the time as a string or values as '[Not Available]'
        try:
            clinical_df[time_column] = clinical_df[time_column].astype(float)
        except ValueError:
            clinical_df = clinical_df[clinical_df[time_column].apply(__is_numerical)]
            clinical_df[time_column] = clinical_df[time_column].astype(float)

        # Saves in disk
        clinical_df.to_csv(temp_file, sep='\t', decimal='.')

    return clinical_temp_file_path


def generate_molecules_dataframe(experiment: ExperimentObjType, samples_in_common: np.ndarray) -> pd.DataFrame:
    """
    Generates the molecules DataFrame for a specific InferenceExperiment, FSExperiment or StatisticalValidation
    with the samples in common.
    @param experiment: Instance to get the sources from.
    @param samples_in_common: Samples in common between all the sources.
    @return: Molecules Pandas DataFrame.
    """
    chunks: List[pd.DataFrame] = []
    for source, molecules, file_type in experiment.get_sources_and_molecules():
        if source is None:
            continue

        only_matching = file_type in [FileType.MRNA, FileType.CNA]  # Only genes must be disambiguated
        chunks.extend([
            __process_chunk(chunk, file_type, molecules, samples_in_common)
            for chunk in source.get_df_in_chunks(only_matching)
        ])

    # Concatenates all the chunks for all the molecules
    return pd.concat(chunks, axis=0, sort=False)


def generate_molecules_file(experiment: ExperimentObjType, samples_in_common: np.ndarray) -> str:
    """
    Generates the molecules DataFrame for a specific InferenceExperiment, FSExperiment or StatisticalValidation
    with the samples in common and saves it in disk.
    @param experiment: Instance to get the sources from.
    @param samples_in_common: Samples in common between all the sources.
    @return: Molecules file path saved in disk.
    """
    with tempfile.NamedTemporaryFile(mode='a', delete=False) as temp_file:
        molecules_temp_file_path = temp_file.name

        for source, molecules, file_type in experiment.get_sources_and_molecules():
            source = cast(Optional[ExperimentSource], source)
            if source is None:
                continue

            only_matching = file_type in [FileType.MRNA, FileType.CNA]  # Only genes must be disambiguated
            for chunk in source.get_df_in_chunks(only_matching=only_matching):
                chunk = __process_chunk(chunk, file_type, molecules, samples_in_common)

                # Saves in disk
                chunk.to_csv(temp_file, header=temp_file.tell() == 0, sep='\t', decimal='.')

    return molecules_temp_file_path


def clean_dataset(df: pd.DataFrame, axis: Axis) -> pd.DataFrame:
    """
    Removes NaN and Inf values.
    :param df: DataFrame to clean.
    :param axis: Axis to remove the Nans values.
    :return: Cleaned DataFrame.
    """
    assert isinstance(df, pd.DataFrame), "df needs to be a pd.DataFrame"

    # Taken from https://stackoverflow.com/a/45746209/7058363
    with pd.option_context('mode.use_inf_as_na', True):
        df = df.dropna(axis=axis, how='any')

    return df


def clinical_df_to_struct_array(clinical_df: pd.DataFrame) -> np.ndarray:
    """
    Converts a Pandas DataFrame with clinical data to a Numpy structured array with the columns 'event' and 'time'.
    @param clinical_df: Clinical data as a Pandas DataFrame.
    @return: Clinical data as a Numpy structured array.
    """
    clinical_data = np.core.records.fromarrays(clinical_df.to_numpy().transpose(), names='event, time',
                                               formats='bool, float')
    return clinical_data


def format_data(molecules_temp_file_path: str, clinical_temp_file_path: str,
                is_regression: bool) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray]:
    """
    Reads both molecules and clinical data and formats them to be used in the models.
    @param molecules_temp_file_path: Molecular data file path.
    @param clinical_temp_file_path: Clinical data file path.
    @param is_regression: Whether the experiment is a regression or not.
    @return: Molecules as Pandas DataFrame and the clinical data as a Pandas DataFrame and as a Numpy structured array.
    """
    # Gets molecules and clinical DataFrames
    molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)
    clinical_df = pd.read_csv(clinical_temp_file_path, sep='\t', decimal='.', index_col=0)

    # NOTE: The event and time columns are ALWAYS the first and second one at this point
    event_column, time_column = clinical_df.columns.tolist()

    # In case of regression removes time == 0 in the datasets to prevent errors in the models fit() method
    if is_regression:
        clinical_df = clinical_df[clinical_df[time_column] > 0]

    # Replaces NaN values
    clinical_df = clean_dataset(clinical_df, axis='index')

    # Removes also inconsistencies in cBioPortal datasets where the event is 1 and the time value is 0
    idx_with_inconsistencies = (clinical_df[event_column] == 1) & (clinical_df[time_column] == 0.0)
    clinical_df = clinical_df.loc[~idx_with_inconsistencies]

    # Keeps only the samples in common after data filtering
    valid_samples = clinical_df.index
    molecules_df = molecules_df[valid_samples]  # Samples are as columns in molecules_df

    # Removes molecules with NaN values
    molecules_df = clean_dataset(molecules_df, axis='index')

    # Formats clinical data to a Numpy structured array
    clinical_data = clinical_df_to_struct_array(clinical_df)

    return molecules_df, clinical_df, clinical_data


def replace_event_col_for_booleans(value: Union[int, str]) -> bool:
    """Replaces string or integer events in datasets to booleans values to make survival analysis later."""
    # Cast to string to check if it's '1' or contains any of the candidates
    value_str = str(value)
    return value_str == '1' or any(candidate in value_str for candidate in COMMON_INTEREST_VALUES)


def __get_sample_classes(clinical_data: np.ndarray) -> np.ndarray:
    """
    Returns the number of sample classes. Code retrieved from Sklearn model_selection module.
    @param clinical_data: Clinical data Numpy array.
    @return: List with a count of each sample class.
    """
    classes, y_idx, y_inv = np.unique(clinical_data, return_index=True, return_inverse=True)
    _, class_perm = np.unique(y_idx, return_inverse=True)
    y_encoded = class_perm[y_inv]
    return np.bincount(y_encoded)


def __sample_classes_are_fewer_than_folds(clinical_data: np.ndarray, number_of_folds: int) -> bool:
    """
    Checks if the number of sample classes is fewer than the number of folds.
    @param clinical_data: Clinical data Numpy array.
    @param number_of_folds: Current number of folds
    @return: True if the number of samples is fewer than the number of folds (an exception should be raised
    as the GridSearch will be fail), False otherwise.
    """
    sample_classes_count = __get_sample_classes(clinical_data)
    return np.all(number_of_folds > sample_classes_count)


def __get_new_cross_validation_folds(clinical_data: np.ndarray, number_of_folds: int) -> int:
    """
    Returns the maximum number of folds to use in the cross validation process. This value is computed from the
    number of sample classes in the clinical data, keeping the maximum count.
    @param clinical_data: Clinical data Numpy array.
    @param number_of_folds: Current number of folds
    @return: True if the number of samples is fewer than the number of folds (an exception should be raised
    as the GridSearch will be fail), False otherwise.
    """
    sample_classes_count = __get_sample_classes(clinical_data)
    smaller_than_splits = sample_classes_count[(sample_classes_count < number_of_folds) & (sample_classes_count >= 3)]
    return np.max(smaller_than_splits) if smaller_than_splits.size > 0 else None


def check_sample_classes(trained_model: TrainedModel, clinical_data: np.ndarray, cross_validation_folds: int):
    """
    Checks if the number of sample classes is fewer than the number of folds. In that case tries to get a possible
    number of folds to train the model. In case no valid number of folds is found, raises an exception.
    @param trained_model: Trained model instance.
    @param clinical_data: Clinical data Numpy array.
    @param cross_validation_folds: Current number of folds.
    @raise NumberOfSamplesFewerThanCVFolds if the number of sample classes is fewer than the number of folds and no
    valid number of folds could be found.
    """
    if __sample_classes_are_fewer_than_folds(clinical_data, cross_validation_folds):
        # Checks if a smaller number of folds can be used
        new_cross_validation = __get_new_cross_validation_folds(clinical_data, cross_validation_folds)
        if new_cross_validation is None:
            raise NumberOfSamplesFewerThanCVFolds(f'Number of unique classes is less than the CV number of folds '
                                                  f'({cross_validation_folds})')

        # Updates the number of folds
        trained_model.cross_validation_folds = new_cross_validation
        trained_model.cv_folds_modified = True
        trained_model.save(update_fields=['cross_validation_folds', 'cv_folds_modified'])


def check_molecules_and_samples_number_or_exception(classifier: SurvModel, molecules_df: pd.DataFrame):
    """
    First, checks if the number of samples is bigger than 0. Then checks if the number of features used to train the
    model is bigger than the number of molecules in the dataset, if so, it's not possible to compute the experiment so
    raises NoValidMolecules.
    @param classifier: Classifier instance.
    @param molecules_df: DataFrame with the molecules.
    @raise NoValidSamples: If the number of samples is 0.
    @raise NoValidMolecules: If the number of features used to train the model is bigger than the number of molecules.
    """
    if molecules_df.size == 0:
        raise NoValidSamples('No valid samples in the dataset')

    # Gets number of features from the fitted model
    n_features_model = classifier.n_features_in_

    # Gets number of features from the dataset
    n_features_dataset = molecules_df.shape[1]
    if n_features_model != n_features_dataset:
        raise NoValidMolecules(f'Not valid molecules to compute the experiment. Expected {n_features_model}, got '
                               f'{n_features_dataset}')
