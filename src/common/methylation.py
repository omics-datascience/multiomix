from typing import Optional, List
from django.db import models
import pandas as pd
import os
import re
from common.constants import PLATFORM_CG_INDEX_NAME, PLATFORM_CG_GENE_COLUMN_NAME, PLATFORM_CG_INDEX_NAME_FINAL, \
    GEM_INDEX_NAME

# Compiles frequent regex to improve performance
CPG_REGEX_COMPILED = re.compile(r'cg[\d]+')
GENE_REGEX_COMPILED = re.compile(r'\([a-zA-Z0-9]+\)')


# TODO: move this class to a general structure in the future in Methylation type entity
class MethylationPlatform(models.IntegerChoices):
    """Possible Methylation CpG site ID platforms"""
    # TODO: add more
    PLATFORM_450 = 450


def get_methylation_platform_dataframe(platform: MethylationPlatform) -> Optional[pd.DataFrame]:
    """
    Gets a DataFrame with CpG site IDs as index and the corresponding gene as column
    @param platform: Platform to retrieve
    @return: Pandas DataFrame of the corresponding Methylation's platform
    """
    file_name = None  # File's name without extension
    if platform == MethylationPlatform.PLATFORM_450:
        file_name = 'Platform450'

    if file_name is None:
        return None

    # Get in relative folder
    dir_name = os.path.dirname(__file__)
    file_path = os.path.join(dir_name, f'methylation_platforms/{file_name}.csv')
    platform_df = pd.read_csv(file_path, sep=None, engine='python', index_col=0)

    # Renames for generalization
    platform_df.index.rename(PLATFORM_CG_INDEX_NAME, inplace=True)
    platform_df.rename(columns={platform_df.columns[0]: PLATFORM_CG_GENE_COLUMN_NAME}, inplace=True)

    return platform_df


def get_columns_order(methylation_data: pd.DataFrame) -> List[str]:
    """
    Generates a list with all the columns to retrieve from DataFrame
    @param methylation_data: DataFrame with methylation data
    @return: List of columns
    """
    columns = methylation_data.columns.values.tolist()
    columns.remove(PLATFORM_CG_GENE_COLUMN_NAME)
    columns.remove(PLATFORM_CG_INDEX_NAME_FINAL)
    return [PLATFORM_CG_GENE_COLUMN_NAME, PLATFORM_CG_INDEX_NAME_FINAL] + columns


def map_cpg_to_genes_df(
    df_source: pd.DataFrame,
    df_platform: pd.DataFrame
) -> pd.DataFrame:
    """
    Makes the mapping from CpG to Genes using an specific platform
    @param df_source: DataFrame with CpG site IDs
    @param df_platform: Specific platform DataFrame
    @return: DataFrame with the first column as index, the second one as CpG index and the rest as the samples
    """
    # Merges to get, for every CpG Site ID, the corresponding gene
    result = df_source.reset_index().merge(
        df_platform.reset_index(),
        how='left',
        left_on=GEM_INDEX_NAME,
        right_on=PLATFORM_CG_INDEX_NAME
    )

    # Fills NaN values (missing gene for current CpG Site ID) with '-'
    result = result.fillna(value={PLATFORM_CG_GENE_COLUMN_NAME: '-'})

    # Set gene column as index, removes redundant CpG Site ID column (created during merge) and renames CpG Site ID
    # column name
    result = result.set_index(PLATFORM_CG_GENE_COLUMN_NAME)
    result = result.drop(PLATFORM_CG_INDEX_NAME, axis=1)
    first_column = result.columns[0]
    result = result.rename(columns={first_column: PLATFORM_CG_INDEX_NAME_FINAL})

    return result


def get_cpg_from_cpg_format_gem(gem: str) -> str:
    """
    Extracts CpG identifier from a string
    @param gem: String to extract the CpG identifier from
    @raise KeyError if the CpG identifier is not found
    @return: CpG if found
    """
    match_cpg = CPG_REGEX_COMPILED.search(gem)
    if match_cpg is not None:
        return match_cpg.group(0)
    raise KeyError


def get_gene_from_cpg_format_gem(gem: str) -> str:
    """
    Extracts Gene identifier from a string
    TODO: add tests
    @param gem: String to extract the Gene identifier from
    @raise KeyError if the Gene identifier is not found
    @return: Gene if found
    """
    match_cpg = GENE_REGEX_COMPILED.search(gem)
    if match_cpg is not None:
        with_parentheses = match_cpg.group(0)
        return with_parentheses.lstrip('(').rstrip(')')
    raise KeyError
