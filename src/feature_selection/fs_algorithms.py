import itertools
import numpy as np
import pandas as pd
from typing import Iterable, List, Callable, Tuple, Union, Dict, Optional, cast
from django.conf import settings
from sklearn import clone
from sklearn.model_selection import cross_val_score, cross_validate, StratifiedKFold
from sksurv.ensemble import RandomSurvivalForest
from sksurv.svm import FastKernelSurvivalSVM


# Fitness function shape
FitnessFunction = Callable[[pd.DataFrame, np.ndarray], float]

# Available survival models to fit during Cross Validation
SurvModel = Union[FastKernelSurvivalSVM, RandomSurvivalForest]


def all_combinations(any_list: List) -> Iterable[List]:
    """
    Returns a Generator with all the combinations of a list. Taken from https://stackoverflow.com/a/31474532/7058363
    """
    return itertools.chain.from_iterable(
        itertools.combinations(any_list, i + 1)
        for i in range(len(any_list))
    )


def compute_cross_validation_sequential(classifier: SurvModel,
                                        subset: pd.DataFrame, y: np.ndarray) -> Tuple[float, SurvModel, float]:
    """
    Computes CrossValidation to get the Concordance Index (using StratifiedKFold to prevent "All samples are censored"
    error).
    :param classifier: Classifier to train.
    :param subset: Subset of features to be used in the model evaluated in the CrossValidation.
    :param y: Classes.
    :return: Average of the C-Index obtained in each CV fold, best model during CV and its fitness score.
    """
    # Create StratifiedKFold object.
    skf = StratifiedKFold(n_splits=10, shuffle=True, random_state=1)
    lst_accu_stratified: List[float] = []
    estimators: List[SurvModel] = []

    for train_index, test_index in skf.split(subset, y):
        # Splits
        x_train_fold, x_test_fold = subset.iloc[train_index], subset.iloc[test_index]
        y_train_fold, y_test_fold = y[train_index], y[test_index]

        # Train and stores fitness
        classifier.fit(x_train_fold, y_train_fold)
        lst_accu_stratified.append(classifier.score(x_test_fold, y_test_fold))

        # Stores trained model
        cloned = clone(classifier)
        cloned = cast(SurvModel, cloned)
        estimators.append(cloned)

    # Gets best fitness
    best_model_idx = np.argmax(lst_accu_stratified)
    best_model = estimators[best_model_idx]
    best_c_index = lst_accu_stratified[best_model_idx]
    fitness_value_mean = cast(float, np.mean(lst_accu_stratified))

    return fitness_value_mean, best_model, best_c_index



def blind_search(classifier: Union[FastKernelSurvivalSVM, RandomSurvivalForest], molecules_df: pd.DataFrame,
                 clinical_data: np.ndarray) -> Tuple[Optional[List[str]], Optional[SurvModel], Optional[float]]:
    """
    Runs a Blind Search running a specific classifier using the molecular and clinical data passed by params.
    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules' data.
    @param clinical_data: Numpy array with the time and event columns.
    @return: The combination of features with the highest fitness score and the highest fitness score achieved by
    any combination of features.
    """
    list_of_molecules: List[str] = molecules_df.index.tolist()
    best_mean_score = float("-inf")
    best_features: Optional[List[str]] = None
    best_model: Optional[SurvModel] = None
    best_score: Optional[float] = None

    for combination in all_combinations(list_of_molecules):
        # Get subset of features
        molecules_to_extract = np.intersect1d(molecules_df.index, combination)
        subset: pd.DataFrame = molecules_df.loc[molecules_to_extract]

        # Discards NaN values
        subset = subset[~pd.isnull(subset)]

        # Makes the rows columns
        subset = subset.transpose()

        # If no molecules are present in the subset due to NaNs values, just discards this combination
        if not subset.any().any():
            continue

        # Computes the fitness function and checks if this combination of features has a higher score
        # than the best found so far
        try:
            score, current_best_model, current_best_c_index = compute_cross_validation_sequential(classifier, subset,
                                                                                              clinical_data)
        except ValueError:
            continue

        if score > best_mean_score:
            best_mean_score = score
            best_features = combination
            best_model = current_best_model
            best_score = current_best_c_index

    return best_features, best_model, best_score
