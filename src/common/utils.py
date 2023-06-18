import numpy as np
from typing import List, Union, Optional
import pandas as pd
from django.http import QueryDict


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
    TODO: refactor to make the transpose on CSV creation to avoid repeating that option everytime (for example
    TODO: blind_search_sequential() call this method on every iteration). Call the transpose method
    TODO: and use the clean_dataset() from above to remove NaN and Inf values, both operations on CSV creation and in
    TODO: that order: transpose() -> clean_dataset() as in the multiomix-emr-integration project.
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


def limit_between_min_max(number: int, min_value: int, max_value: int) -> int:
    """Limits a number between a min and max values."""
    return max(min(number, max_value), min_value)


def remove_non_alphanumeric_chars(string: str) -> str:
    """Replaces all the non-alphanumeric chars from the job name to respect the [\.\-_/#A-Za-z0-9]+ regex"""
    return ''.join(e for e in string if e.isalnum() or e in ['.', '-', '_', '/', '#'])
