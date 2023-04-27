import re
import numpy as np
from typing import List, Union, Optional
import pandas as pd
from django.http import QueryDict

from common.constants import TCGA_CONVENTION


def replace_cgds_suffix(list_of_ids: Union[List[str], np.ndarray]) -> List[str]:
    """
    Replaces TCGA suffix: '-01' (primary tumor), -06 (metastatic) and '-11' (normal) to avoid issues.
    NOTE: this function has to be here due to circular imports.
    @param list_of_ids: List of IDs to modify.
    @return: List with all the IDs without the suffix.
    """
    regex_strip = re.compile(TCGA_CONVENTION)
    return [re.sub(regex_strip, "", name) for name in list_of_ids]


def get_source_pk(post_request: QueryDict, key: str) -> Optional[int]:
    """
    Gets a PK as int from the POST QueryDict. None if it's invalid
    @param post_request: POST QueryDict
    @param key: Key in the POST QueryDict to retrieve
    @return: Int PK or None if it's invalid
    """
    content = post_request.get(key)
    if content is None or content == 'null':
        return None
    return int(content)


def get_subset_of_features(molecules_df: pd.DataFrame, combination: Union[List[str], np.ndarray]) -> pd.DataFrame:
    """
    Gets a specific subset of features from a Pandas DataFrame.
    @param molecules_df: Pandas DataFrame with all the features.
    @param combination: Combination of features to extract.
    @return: A Pandas DataFrame with only the combinations of features.
    """
    # Get subset of features
    if isinstance(combination, np.ndarray):
        # In this case it's a Numpy array with int indexes (used in metaheuristics)
        subset: pd.DataFrame = molecules_df.iloc[combination]
    else:
        # In this case it's a list of columns names (used in Blind Search)
        molecules_to_extract = np.intersect1d(molecules_df.index, combination)
        subset: pd.DataFrame = molecules_df.loc[molecules_to_extract]

    # Discards NaN values
    subset = subset[~pd.isnull(subset)]

    # Makes the rows columns
    subset = subset.transpose()
    return subset
