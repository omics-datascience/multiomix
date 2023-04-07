import itertools
import numpy as np
import pandas as pd
from typing import Iterable, List, Callable, Tuple, Union
from django.conf import settings
from sklearn.model_selection import cross_val_score
from sksurv.ensemble import RandomSurvivalForest
from sksurv.svm import FastKernelSurvivalSVM


# Fitness function shape
FitnessFunction = Callable[[pd.DataFrame, np.ndarray], float]


def all_combinations(any_list: List) -> Iterable[List]:
    """
    Returns a Generator with all the combinations of a list. Taken from https://stackoverflow.com/a/31474532/7058363
    """
    return itertools.chain.from_iterable(
        itertools.combinations(any_list, i + 1)
        for i in range(len(any_list))
    )


def compute_cross_validation_sequential(classifier: Union[FastKernelSurvivalSVM, RandomSurvivalForest],
                                        subset: pd.DataFrame, y: np.ndarray) -> float:
    """
    Computes CrossValidation to get the Concordance Index.
    :param classifier: Classifier to train
    :param subset: Subset of features to be used in the model evaluated in the CrossValidation
    :param y: Classes
    :return: Average of the C-Index obtained in each CrossValidation fold
    """
    res = cross_val_score(
        classifier,
        subset,
        y,
        cv=10,
        n_jobs=settings.N_JOBS_CV
    )
    return res.mean()



# def blind_search(fitness_function: FitnessFunction, molecules_df: pd.DataFrame,
def blind_search(classifier: Union[FastKernelSurvivalSVM, RandomSurvivalForest], molecules_df: pd.DataFrame,
                 clinical_data: np.ndarray) -> Tuple[List[str], float]:
    """

    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules data.
    @param clinical_data: Numpy array with the time and event columns.
    @return: The combination of features with the highest fitness score and the highest fitness score achieved by
    any combination of features.
    """
    list_of_molecules: List[str] = molecules_df.index.tolist()
    best_score = float("-inf")
    best_features = None

    for combination in all_combinations(list_of_molecules):
        # Get subset of features
        molecules_to_extract = np.intersect1d(molecules_df.index, combination)
        subset: pd.DataFrame = molecules_df.loc[molecules_to_extract]

        # Makes the rows columns
        subset = subset.transpose()

        # Computes the fitness function and checks if this combination of features has a higher score
        # than the best found so far
        score = compute_cross_validation_sequential(classifier, subset, clinical_data)

        if score > best_score:
            best_score = score
            best_features = combination

    return best_features, best_score
