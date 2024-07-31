import os
import tempfile
import time
import pandas as pd
import numpy as np
from billiard.pool import Pool
from common.constants import GEM_INDEX_NAME
from common.functions import check_if_stopped
from common.methylation import get_cpg_from_cpg_format_gem, get_gene_from_cpg_format_gem, \
    map_cpg_to_genes_df
from common.typing import AbortEvent
from .exceptions import NoSamplesInCommon, ExperimentStopped, ExperimentFailed
from django.conf import settings
from typing import Tuple, Type, List, cast, Optional, Union, Iterator, IO
from .models import ExperimentSource, Experiment, GeneGEMCombination
from django.db import connection
import ggca
import logging


def __run_ggca(
    mrna_file_path: str,
    gem_file_path: str,
    experiment: Experiment,
    collect_gem_dataset: bool,
    is_cpg_analysis: bool,
    keep_top_n: Optional[int]
) -> Tuple[List[ggca.CorResult], int, int]:
    """
    Runs GGCA correlation analysis.
    @param mrna_file_path: mRNA temp file path.
    @param gem_file_path: GEM temp file path.
    @param collect_gem_dataset: True to make the GEM dataset available in memory.
    @param experiment: Experiment object with params for correlation analysis.
    @param is_cpg_analysis: True to indicate that the second column in GEM dataset contains CpG Site IDs.
    @param keep_top_n: To truncate results. None to keep all the resulting combinations.
    @return: A tuple with a vec of CorResult, the number of combinations before truncating by 'keep_top_n' parameter
    and the number of combinations evaluated.
    """
    return ggca.correlate(
        mrna_file_path,
        gem_file_path,
        correlation_method=experiment.correlation_method,
        correlation_threshold=experiment.minimum_coefficient_threshold,
        sort_buf_size=settings.SORT_BUFFER_SIZE,
        adjustment_method=experiment.p_values_adjustment_method,
        is_all_vs_all=experiment.correlate_with_all_genes,
        gem_contains_cpg=is_cpg_analysis,
        collect_gem_dataset=collect_gem_dataset,
        keep_top_n=keep_top_n
    )


def get_valid_data_from_sources(
    experiment: Experiment,
    gene_index: str,
    gem_index: str,
    round_values: bool,
    clinical_attribute: Optional[str] = None,
    return_samples_identifiers: bool = False,
    fill_clinical_missing_samples: bool = True
) -> Union[
    Tuple[np.ndarray, np.ndarray],
    Tuple[np.ndarray, np.ndarray, np.ndarray],
    Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray],
    Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]
]:
    """
    Gets a pd.Series with a Gene, a GEM and, optionally, clinical data from experiment sources
    @param experiment: Experiment to get the source data
    @param gene_index: Gene row's index to retrieve
    @param gem_index: GEM row's index to retrieve
    @param round_values: True if you want to round to 3 decimal, False to keep original value
    @param clinical_attribute: Clinical attribute  to retrieve
    @param fill_clinical_missing_samples: If True it fills the samples which don't exist in clinical source with
    'NA' values. If False, those samples will be discarded
    @param return_samples_identifiers: True if you want to get samples which the expressions correspond to
    @return: Numpy arrays with the specified info
    """
    # Keeps only the samples in common
    gene_source: ExperimentSource = experiment.mRNA_source
    gem_source: ExperimentSource = experiment.gem_source

    _, idx_common_df1, idx_common_df2 = get_common_samples(
        gene_source,
        gem_source,
        assume_unique=True,  # It's safe as Datasets has unique samples (that is, columns names aren't repeated)
        return_indices=True
    )

    # Checks if it's needed to parse the GEM (maybe is in <gene> (<CpG>) format)
    gem_platform = gem_source.get_methylation_platform_df()
    try:
        gem_index = gem_index if gem_platform is None else get_cpg_from_cpg_format_gem(gem_index)
    except KeyError:
        # If KeyError is thrown is because user marked incorrectly the dataset as one that contains
        # CpG Site IDs instead of Genes
        gem_index = get_gene_from_cpg_format_gem(gem_index)

    # Retrieves specific row and the in common columns
    gene_values = gene_source.get_specific_row_and_columns(gene_index, idx_common_df1)
    gem_values = gem_source.get_specific_row_and_columns(gem_index, idx_common_df2)

    # Gets NaNs positions in boolean array
    gene_nans_idx = np.isnan(gene_values)
    gem_nans_idx = np.isnan(gem_values)
    nans_values = gene_nans_idx | gem_nans_idx
    non_nan_condition = ~nans_values

    # Removes NaNs values
    gene_values = gene_values[non_nan_condition]
    gem_values = gem_values[non_nan_condition]

    # +++++ CLINICAL +++++
    # Checks clinical stuff
    if clinical_attribute is not None:
        clinical_source = experiment.clinical_source
        # Uses genes data only as it has samples in common with GEM, so it's valid
        samples_in_common_gene_gem = np.array(gene_source.get_samples())[idx_common_df1]
        clinical_samples = clinical_source.get_samples()

        _, idx_common_gene_gem_with_clinical, idx_common_clinical = np.intersect1d(
            samples_in_common_gene_gem,
            clinical_samples,
            assume_unique=True,
            return_indices=True
        )

        # Gets Gene/GEM/Clinical common samples
        clinical_samples_common = np.array(clinical_samples)[idx_common_clinical]

        # IMPORTANT: clinical data is transposed so row are samples, and columns attributes
        # Gets values for Gene/GEM/Clinical common samples
        clinical_values: np.ndarray = clinical_source.get_specific_samples_and_attributes(
            clinical_samples_common,
            [clinical_attribute]
        )

        # Cast all to str type (object type in Numpy) to prevent some issues setting values like 'NA'
        clinical_values = clinical_values.astype(object)

        # If fill missing samples option was selected generates an array of the same length as genes/GEMs and fills
        # the valid clinical data positions
        if fill_clinical_missing_samples:
            # Generates an empty array with 'NA' values
            empty = np.full(gene_values.size, settings.NON_DATA_VALUE, dtype=object)

            # Fill only the valid positions (i.e. common samples in clinical dataset)
            for (idx, value) in zip(idx_common_gene_gem_with_clinical, clinical_values):
                empty[idx] = value

            clinical_values = empty
        else:
            # As not filling was selected, keeps only the common samples
            gene_values = gene_values[idx_common_gene_gem_with_clinical]
            gem_values = gem_values[idx_common_gene_gem_with_clinical]

            # Clinical values are correct, but it's needed to filter the clinical samples
            clinical_samples = clinical_samples_common
    else:
        clinical_values = np.array([])
        clinical_samples = np.array([])

    clinical_values = fill_null_values_with_custom_value(clinical_values)

    # Rounds if needed
    if round_values:
        gene_values = np.round(gene_values, decimals=3)
        gem_values = np.round(gem_values, decimals=3)

    # Gets samples
    if return_samples_identifiers:
        gene_samples = np.array(gene_source.get_samples())[idx_common_df1]
        gem_samples = np.array(gem_source.get_samples())[idx_common_df2]

        # Removes NaNs positions in samples names
        gene_samples = gene_samples[non_nan_condition]
        gem_samples = gem_samples[non_nan_condition]

        if clinical_attribute is not None:
            return gene_values, gem_values, clinical_values, gene_samples, gem_samples, clinical_samples

        return gene_values, gem_values, gene_samples, gem_samples

    if clinical_attribute is not None:
        return gene_values, gem_values, clinical_values

    return gene_values, gem_values


def fill_null_values_with_custom_value(clinical_values: np.ndarray) -> np.ndarray:
    """
    Fills None, empty and nan value with settings.NON_DATA_VALUE to make a generic filter by invalid values.
    The clinical data MUST be a 'object' type.
    @param clinical_values: Numpy array with clinical data to fill.
    @return: Clinical data with the empty values filled.
    """
    # In case of clinical values, filters NaNs values
    if clinical_values.size > 0:
        # Uses pd.isnull as clinical data could not be a native dtype (i.e. it's an object type)
        clinical_nans_idx = pd.isnull(clinical_values)
        clinical_values[clinical_nans_idx] = settings.NON_DATA_VALUE
    return clinical_values


def get_common_samples(
        source_1: ExperimentSource,
        source_2: ExperimentSource,
        assume_unique: bool = False,
        return_indices: bool = False
) -> np.ndarray:
    """
    Gets a sorted Numpy array with the samples ID in common between both ExperimentSources
    @param source_1: Source 1
    @param source_2: Source 2
    @param assume_unique: Parameter of intersect1d() to better performance if elements in list are unique
    @param return_indices: Parameter of intersect1d() to return indices of common elements
    @return: Sorted Numpy array with the samples in common
    """
    # NOTE: the intersection is already sorted by Numpy
    return cast(np.ndarray, np.intersect1d(
        source_1.get_samples(),
        source_2.get_samples(),
        assume_unique=assume_unique,
        return_indices=return_indices
    ))


def __prepare_df(
        df: pd.DataFrame,
        minimum_std: float,
        common_columns: np.ndarray,
        index: str
) -> pd.DataFrame:
    """
    Filters and sorts column of two DataFrames
    @param df: DataFrame to prepare
    @param minimum_std: Minimum Standard Deviation normalized to filter
    @param common_columns: Columns in common between both Sources' DataFrame
    @param index: Index name to set to the df
    @return: A tuple with both processed DataFrames
    """
    # Rename index columns for general names
    df.index.rename(index, inplace=True)

    # Keep only the in common columns
    df = df[common_columns]

    # Rearrange the names of the columns
    df = df.reindex(common_columns, axis=1)

    # TODO: implement in frontend to be selectable by row or column, for the moment only rows
    df = df.dropna(axis=0)

    # Filter by Standard Deviation normalized (if needed)
    if minimum_std:
        standard_deviation = df.std(axis=1)  # TODO: check ddof
        # TODO: analyze if correspond to normalize in [0 - 1] range!!!
        # minimum = standard_deviation.min()
        # normalized = (standard_deviation - minimum) / (standard_deviation.max() - minimum)
        # df = df[normalized >= minimum_std]
        df = df[standard_deviation >= minimum_std]

    return df


def __get_chunks_of_list(lst: List, page_size: int) -> Iterator:
    """
    Yield successive n-sized chunks from lst
    @param lst: List to paginate
    @param page_size: Page size
    @return: Chunk iterator
    """
    for i in range(0, len(lst), page_size):
        yield lst[i:i + page_size]


def __save_result_in_db(combinations: List[ggca.CorResult], experiment: Experiment, table_name: str):
    """
    Saves in Db a list of combinations resulting from an experiment
    @param combinations: List of combinations to insert in DB
    @param experiment: Experiment object to retrieve some information
    @param table_name: Table name where combinations will be inserted
    """
    logging.warning(f'Inserting {len(combinations)} combinations')
    # Don't put whitespaces between commas to save MBs in string (this could be huge)
    insert_query_prefix = f'INSERT INTO {table_name} ' \
                          f'(gene,gem,correlation,p_value,adjusted_p_value,experiment_id) VALUES '
    insert_template = "('{}','{}',{:.4f},{},{}," + str(experiment.pk) + ")"

    for chunk in __get_chunks_of_list(combinations, settings.INSERT_CHUNK_SIZE):
        insert_statements: List[str] = [
            # Replaces single quotes to make them compatible with Postgres.
            # More info: https://stackoverflow.com/a/32586758/7058363
            insert_template.format(
                cor_result.gene.replace("'", "''"),
                cor_result.gem.replace("'", "''"),
                cor_result.correlation,
                cor_result.p_value,
                cor_result.adjusted_p_value
            )
            for cor_result in chunk
        ]

        insert_query = insert_query_prefix + ','.join(insert_statements)

        start = time.time()
        with connection.cursor() as cursor:
            cursor.execute(insert_query)
        logging.warning(f'INSERT execution time -> {time.time() - start} seconds')


def __generate_clean_temp_file(
        source: ExperimentSource,
        common_samples: np.ndarray,
        experiment: Experiment,
        index: str,
        check_cpg_platform: bool,
) -> Tuple[IO, int, bool]:
    """
    Creates a NamedTemporaryFile and adds all the information of source with needed format for Rust library (GGCA)
    @param source: Experiment's source to retrieve data in chunks
    @param common_samples: Common samples to filter and prepare dataset
    @param experiment: Experiment to retrieve some information
    @param index: Index to apply to the DataFrame to prevent some errors in Pandas
    @param check_cpg_platform: True to check if CpG mapping is needed (only applies for GEM in case of Methylation)
    @return: Temp file object, number of rows saved in it and a boolean value indicating if there was CpG mapping
    """
    # Checks if CpG Site ID mapping is needed
    gem_platform_df = None if not check_cpg_platform else experiment.gem_source.get_methylation_platform_df()

    # Delete is set to False to prevent errors in Rust
    temp_file = tempfile.NamedTemporaryFile(mode='a', delete=False)
    number_of_rows = 0
    for chunk in source.get_df_in_chunks():
        chunk = __prepare_df(chunk, experiment.minimum_std_gene, common_samples, index)

        # CpG Site IDs mapping
        if gem_platform_df is not None:
            chunk = map_cpg_to_genes_df(chunk, gem_platform_df)

        chunk.to_csv(temp_file, header=temp_file.tell() == 0, sep='\t', decimal='.')
        number_of_rows += chunk.shape[0]

    temp_file.close()
    return temp_file, number_of_rows, gem_platform_df is not None


def __concatenate_gene_and_cpg_as_gem(combinations: List[ggca.CorResult]) -> List[ggca.CorResult]:
    """
    Concatenates Gene and CpG Site ID for methylation results
    @param combinations: List of analysis result combinations
    @return: List of analysis result combinations with modified GEM description to include the CpG Site ID
    """
    for combination in combinations:
        combination.gem = f'{combination.gem} ({combination.cpg_site_id})'
    return combinations


def __should_collect_gem_dataset(gem_file_path: str) -> Optional[bool]:
    """
    Check if GEM dataset should be allocated to get the best analysis performance or, on the other hand, be computed
    lazily with minimum memory consumption. It checks against settings parameters
    @param gem_file_path: GEM dataset file path to get the file size
    @return: None if there's not a parameter in settings.py. True if file size is below threshold, False otherwise
    """
    size_threshold_mb = settings.THRESHOLD_GEM_SIZE_TO_COLLECT
    if size_threshold_mb is None:
        return None  # Will be determined automatically by GGCA

    size_in_bytes = os.path.getsize(gem_file_path)
    size_in_mb = size_in_bytes / 1048576  # 1024 * 1024
    return size_in_mb <= size_threshold_mb

def __compute_correlation_and_p_values(
        experiment: Experiment,
        common_samples: np.ndarray,
        combination_class: Type[GeneGEMCombination],
        result_limit_row_count: Optional[int],
        is_aborted: AbortEvent
) -> Tuple[int, int]:
    """
    Compute Pearson correlation splitting DataFrames in chunks to avoid memory errors
    @param experiment: Experiment to compute in chunks
    @param common_samples: Numpy array with the samples in common
    @param combination_class: Model class to create the bulk and insert
    @param result_limit_row_count: Number of combinations to keep. If None, all combinations will be kept.
    @param is_aborted: Method to call to check if the experiment has been stopped.
    @return Number of evaluated combinations
    """
    # Parameters to make the insert query
    table_name = combination_class._meta.db_table

    # Generates temp files to be consumed by Rust
    check_if_stopped(is_aborted, ExperimentStopped)
    mrna_temp_file, mrna_number_of_rows, _ = __generate_clean_temp_file(experiment.mRNA_source, common_samples,
                                                                             experiment, 'geneID',
                                                                             check_cpg_platform=False)
    gem_temp_file, gem_number_of_rows, is_cpg_analysis = __generate_clean_temp_file(
        experiment.gem_source,
        common_samples,
        experiment,
        GEM_INDEX_NAME,
        check_cpg_platform=True
    )

    # Computes correlation, p_values and adjusted_p_values
    mrna_file_path = mrna_temp_file.name
    gem_file_path = gem_temp_file.name

    # Checks if it should collect GEM dataset in memory
    collect_gem_dataset = __should_collect_gem_dataset(gem_file_path)
    check_if_stopped(is_aborted, ExperimentStopped)

    # Runs GGCA correlation in a Process to allow user stopping
    with Pool(processes=1) as pool:
        cor_process = pool.apply_async(func=__run_ggca, args=(mrna_file_path, gem_file_path,
                                                              experiment, collect_gem_dataset,
                                                              is_cpg_analysis, result_limit_row_count))
        while not cor_process.ready():
            cor_process.wait(timeout=1)
            if is_aborted():
                pool.terminate()
                raise ExperimentStopped

        try:
            analysis_result = cor_process.get()
        except Exception as ex:
            logging.error('Correlation process has raised an exception')
            logging.exception(ex)
            raise ExperimentFailed

    result_combinations, total_row_count, number_of_evaluated_combinations = analysis_result

    # Concatenates Gene with CpG Site IDs (if needed)
    check_if_stopped(is_aborted, ExperimentStopped)
    if is_cpg_analysis:
        result_combinations = __concatenate_gene_and_cpg_as_gem(result_combinations)

    # Saves in DB. It spawns a new Process to prevent high memory consumption
    check_if_stopped(is_aborted, ExperimentStopped)
    __save_result_in_db(result_combinations, experiment, table_name)

    # Deletes temp files
    os.unlink(mrna_file_path)
    os.unlink(gem_file_path)

    return total_row_count, number_of_evaluated_combinations


def compute_correlation_experiment(experiment: Experiment, is_aborted: AbortEvent) -> Tuple[int, int, int]:
    """
    Computes a correlation analysis between all the rows from a Cartesian Product between two Dataframes.
    @param experiment: Experiment to compute.
    @param is_aborted: Method to call to check if the experiment has been stopped.
    @raise NoSamplesInCommon If there's not any sample in common between both sources.
    @return Total row count, the final row count (used in case it's truncated) and number of evaluated combinations.
    """
    # First checks if there's any sample in common
    common_samples = get_common_samples(experiment.mRNA_source, experiment.gem_source)
    if common_samples.size == 0:
        raise NoSamplesInCommon

    # Gets the combination class
    combination_class: Type[GeneGEMCombination] = experiment.get_combination_class()

    check_if_stopped(is_aborted, ExperimentStopped)

    # Truncates the result if specified in settings.py
    result_limit_row_count: Optional[int] = settings.RESULT_DATAFRAME_LIMIT_ROWS \
        if settings.RESULT_DATAFRAME_LIMIT_ROWS \
        else None

    start = time.time()
    total_row_count, number_of_evaluated_combinations = __compute_correlation_and_p_values(
        experiment,
        common_samples,
        combination_class,
        result_limit_row_count,
        is_aborted
    )
    logging.warning(f'Total correlation execution time -> {time.time() - start} seconds')

    # Computes final number of combinations
    final_row_count = experiment.combinations.count()

    return total_row_count, final_row_count, number_of_evaluated_combinations