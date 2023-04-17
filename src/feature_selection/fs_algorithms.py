import itertools
from typing import Iterable, List, Callable, Tuple, Union, Optional, cast
import numpy as np
import pandas as pd
from lifelines import CoxPHFitter
from sklearn import clone
from sklearn.cluster import KMeans, SpectralClustering
from sklearn.model_selection import StratifiedKFold
from sksurv.ensemble import RandomSurvivalForest
from sksurv.svm import FastKernelSurvivalSVM

from feature_selection.fs_models import ClusteringModels
from feature_selection.models import ClusteringScoringMethod

# Fitness function shape
FitnessFunction = Callable[[pd.DataFrame, np.ndarray], float]

# Available survival models to fit during Cross Validation
SurvModel = Union[FastKernelSurvivalSVM, RandomSurvivalForest, KMeans, SpectralClustering]


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
    @param classifier: Classifier to train.
    @param subset: Subset of features to be used in the model evaluated in the CrossValidation.
    @param y: Classes.
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


def compute_clustering_sequential(classifier: ClusteringModels,
                                  subset: pd.DataFrame,
                                  y: np.ndarray,
                                  score_method: ClusteringScoringMethod) -> Tuple[float, SurvModel, float]:
    """
    Computes a clustering algorithm and gets the C-Index or Log Likelihood.
    @param classifier: Classifier to train.
    @param subset: Subset of features to be used in the model evaluated in the CrossValidation.
    @param y: Classes.
    @param score_method: Clustering scoring method to optimize.
    :return: C-Index/Log-likelihood obtained in the clustering process, best model during CV and the fitness value again
    (just for compatibility with the caller function).
    """
    clustering_result = classifier.fit(subset.values)

    # Generates a DataFrame with a column for time, event and the group
    labels = clustering_result.labels_
    dfs: List[pd.DataFrame] = []
    for cluster_id in range(classifier.n_clusters):
        current_group_y = y[np.where(labels == cluster_id)]
        dfs.append(
            pd.DataFrame({'E': current_group_y['event'], 'T': current_group_y['time'], 'group': cluster_id})
        )
    df = pd.concat(dfs)

    # Fits a Cox Regression model using the column group as the variable to consider
    cph: CoxPHFitter = CoxPHFitter().fit(df, duration_col='T', event_col='E')

    # This documentation recommends using log-likelihood to optimize:
    # https://lifelines.readthedocs.io/en/latest/fitters/regression/CoxPHFitter.html#lifelines.fitters.coxph_fitter.SemiParametricPHFitter.score
    scoring_method = 'concordance_index' if score_method == ClusteringScoringMethod.C_INDEX else 'log_likelihood'
    fitness_value = cph.score(df, scoring_method=scoring_method)

    return fitness_value, classifier, fitness_value

def blind_search(classifier: SurvModel,
                 molecules_df: pd.DataFrame,
                 clinical_data: np.ndarray,
                 is_clustering: bool,
                 score_method: Optional[ClusteringScoringMethod]) -> Tuple[Optional[List[str]], Optional[SurvModel], Optional[float]]:
    """
    Runs a Blind Search running a specific classifier using the molecular and clinical data passed by params.
    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules' data.
    @param clinical_data: Numpy array with the time and event columns.
    @param is_clustering: If True, no CV is computed as clustering needs all the samples to make predictions.
    @param score_method: Clustering scoring method to optimize.
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
            if is_clustering:
                score, current_best_model, best_score = compute_clustering_sequential(
                    classifier,
                    subset,
                    clinical_data,
                    score_method=score_method
                )
            else:
                score, current_best_model, best_score = compute_cross_validation_sequential(
                    classifier,
                    subset,
                    clinical_data
                )
        except ValueError:
            continue

        if score > best_mean_score:
            best_mean_score = score
            best_features = combination
            best_model = current_best_model
            best_score = best_score

    return best_features, best_model, best_score
