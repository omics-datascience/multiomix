import numpy as np
from typing import List, Union, Optional, cast
import pandas as pd
from django.http import QueryDict
from api_service.models import ExperimentSource


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


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Removes NaN and Inf values.
    :param df: DataFrame to clean.
    :return: Cleaned DataFrame.
    """
    assert isinstance(df, pd.DataFrame), "df needs to be a pd.DataFrame"
    df = df.dropna(axis='columns')
    indices_to_keep = ~df.isin([np.nan, np.inf, -np.inf]).any('columns')
    return df[indices_to_keep].astype(np.float64)


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
