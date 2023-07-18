import logging
import random
import warnings
import itertools
import numpy as np
import pandas as pd
from math import tanh
from django.conf import settings
from lifelines.exceptions import ConvergenceError
from sklearn import clone
from typing import Iterable, List, Callable, Tuple, Union, Optional, cast
from lifelines import CoxPHFitter
from scipy.special import factorial
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sksurv.ensemble import RandomSurvivalForest
from sksurv.exceptions import NoComparablePairException
from sksurv.linear_model import CoxnetSurvivalAnalysis
from sksurv.svm import FastKernelSurvivalSVM
from common.utils import get_subset_of_features
from feature_selection.fs_models import ClusteringModels
from feature_selection.models import ClusteringScoringMethod
from feature_selection.utils import get_random_subset_of_features_bbha, get_best_bbha
from sklearn.exceptions import FitFailedWarning
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# Fitness function shape
FitnessFunction = Callable[[pd.DataFrame, np.ndarray], float]

# Available survival models to fit during Cross Validation
SurvModel = Union[FastKernelSurvivalSVM, RandomSurvivalForest, ClusteringModels]

# Result of Blind Search or metaheuristics
FSResult = Tuple[Optional[List[str]], Optional[SurvModel], Optional[float]]

# Result of Cox net analysis
CoxNetAnalysisResult = Tuple[Optional[List[str]], Optional[SurvModel],List[float]]


def __all_combinations(any_list: List) -> Iterable[List]:
    """
    Returns a Generator with all the combinations of a list. Taken from https://stackoverflow.com/a/31474532/7058363.
    """
    return itertools.chain.from_iterable(
        itertools.combinations(any_list, i + 1)
        for i in range(len(any_list))
    )


def __compute_cross_validation_sequential(classifier: SurvModel, subset: pd.DataFrame, y: np.ndarray,
                                          cross_validation_folds: int,
                                          more_is_better: bool) -> Tuple[float, SurvModel, float]:
    """
    Computes CrossValidation to get the Concordance Index (using StratifiedKFold to prevent "All samples are censored"
    error).
    @param classifier: Classifier to train.
    @param subset: Subset of features to be used in the model evaluated in the CrossValidation.
    @param y: Classes.
    @param cross_validation_folds: Number of folds in the CrossValidation process.
    @return: Average of the C-Index obtained in each CV fold, best model during CV and its fitness score.
    """
    # Create StratifiedKFold object.
    skf = StratifiedKFold(n_splits=cross_validation_folds, shuffle=True)
    lst_score_stratified: List[float] = []
    estimators: List[SurvModel] = []

    for train_index, test_index in skf.split(subset, y):
        # Splits
        x_train_fold, x_test_fold = subset.iloc[train_index], subset.iloc[test_index]
        y_train_fold, y_test_fold = y[train_index], y[test_index]

        # Creates a cloned instance of the model to store in the list. This HAVE TO be done before fit() because
        # clone() method does not clone the fit_X_ attribute (needed to restore the model during statistical
        # validations)
        cloned = clone(classifier)
        cloned = cast(SurvModel, cloned)

        # Train and stores fitness
        cloned.fit(x_train_fold, y_train_fold)
        try:
            score = cloned.score(x_test_fold, y_test_fold)
        except NoComparablePairException:
            # To prevent issues with RF training with data that don't have any comparable pair
            score = 0.0
        lst_score_stratified.append(score)

        # Stores trained model
        estimators.append(cloned)

    # Gets best fitness
    if more_is_better:
        best_model_idx = np.argmax(lst_score_stratified)
    else:
        best_model_idx = np.argmin(lst_score_stratified)
    best_model = estimators[best_model_idx]
    best_fitness_value = lst_score_stratified[best_model_idx]
    fitness_value_mean = cast(float, np.mean(lst_score_stratified))

    return fitness_value_mean, best_model, best_fitness_value


def __compute_clustering_sequential(classifier: ClusteringModels, subset: pd.DataFrame, y: np.ndarray,
                                    score_method: ClusteringScoringMethod,
                                    more_is_better: bool) -> Tuple[float, SurvModel, float]:
    """
    Computes a clustering algorithm and gets the C-Index or Log Likelihood.
    @param classifier: Classifier to train.
    @param subset: Subset of features to be used in the model evaluated in the CrossValidation.
    @param y: Classes.
    @param score_method: Clustering scoring method to optimize.
    @param more_is_better: If the scoring method is C-Index, this parameter indicates if the higher value is better.
    For Log Likelihood, the lower value is better.
    @return: C-Index/Log-likelihood obtained in the clustering process, best model during CV and the fitness value again
    (just for compatibility with the caller function).
    """
    # Creates a cloned instance of the model to train. This HAVE TO be done before fit() to prevent
    # issues with the number of clusters during different iterations of Blind Search or metaheuristics (it kept the
    # first configuration, raising the error "ValueError: X has N features, but KMeans is expecting M features
    # as input.")
    cloned = clone(classifier)
    cloned = cast(ClusteringModels, cloned)

    clustering_result = cloned.fit(subset.values)

    # Generates a DataFrame with a column for time, event and the group
    labels = clustering_result.labels_
    dfs: List[pd.DataFrame] = []
    for cluster_id in range(cloned.n_clusters):
        current_group_y = y[np.where(labels == cluster_id)]
        dfs.append(
            pd.DataFrame({'E': current_group_y['event'], 'T': current_group_y['time'], 'group': cluster_id})
        )
    df = pd.concat(dfs)

    # Fits a Cox Regression model using the column group as the variable to consider
    try:
        cph: CoxPHFitter = CoxPHFitter().fit(df, duration_col='T', event_col='E')

        # This documentation recommends using log-likelihood to optimize:
        # https://lifelines.readthedocs.io/en/latest/fitters/regression/CoxPHFitter.html#lifelines.fitters.coxph_fitter.SemiParametricPHFitter.score
        scoring_method = 'concordance_index' if score_method == ClusteringScoringMethod.C_INDEX else 'log_likelihood'
        fitness_value = cph.score(df, scoring_method=scoring_method)
    except ConvergenceError as ex:
        n_features = subset.shape[1]

        # If the model does not converge, it returns the worst fitness value
        if more_is_better:
            fitness_value = -1.0
        else:
            # For negative Log-likelihood the worst value is the higher one
            fitness_value = 0.0

        logging.warning(f'Convergence error during FS with {n_features} features: {ex}. '
                        f'Setting to fitness value to {fitness_value}...')

    return fitness_value, cloned, fitness_value


def blind_search_sequential(classifier: SurvModel,
                            molecules_df: pd.DataFrame,
                            clinical_data: np.ndarray,
                            is_clustering: bool,
                            cross_validations_folds: int,
                            clustering_score_method: Optional[ClusteringScoringMethod]) -> FSResult:
    """
    Runs a Blind Search running a specific classifier using the molecular and clinical data passed by params.
    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules' data.
    @param clinical_data: Numpy array with the time and event columns.
    @param is_clustering: If True, no CV is computed as clustering needs all the samples to make predictions.
    @param cross_validations_folds: Number of folds to use in the Cross Validation.
    @param clustering_score_method: Clustering scoring method to optimize.
    @return: The combination of features with the highest fitness score and the highest fitness score achieved by
    any combination of features.
    """
    # In case of negative Log-likelihood (only used in clustering). If it is lower, better!
    more_is_better = not is_clustering or clustering_score_method != ClusteringScoringMethod.LOG_LIKELIHOOD

    list_of_molecules: List[str] = molecules_df.index.tolist()
    best_mean_score = float("-inf") if more_is_better else float("inf")
    best_features: Optional[List[str]] = None
    best_model: Optional[SurvModel] = None
    best_score: Optional[float] = None

    for combination in __all_combinations(list_of_molecules):
        subset = get_subset_of_features(molecules_df, combination)

        # If no molecules are present in the subset due to NaNs values, just discards this combination
        if not subset.any().any():
            continue

        # Computes the fitness function and checks if this combination of features has a higher score
        # than the best found so far
        try:
            if is_clustering:
                current_mean_score, current_best_model, current_best_score = __compute_clustering_sequential(
                    classifier,
                    subset,
                    clinical_data,
                    score_method=clustering_score_method,
                    more_is_better=more_is_better
                )
            else:
                # SVM/RF
                current_mean_score, current_best_model, current_best_score = __compute_cross_validation_sequential(
                    classifier,
                    subset,
                    clinical_data,
                    cross_validations_folds,
                    more_is_better=more_is_better
                )
        except ValueError:
            continue

        if (more_is_better and current_mean_score > best_mean_score) or \
                (not more_is_better and current_mean_score < best_mean_score):
            best_mean_score = current_mean_score
            best_features = combination
            best_model = current_best_model
            best_score = current_best_score

    return best_features, best_model, best_score


def __compute_bbha_fitness_function(classifier: SurvModel, subset: pd.DataFrame, clinical_data: np.ndarray,
                                    is_clustering: bool, clustering_score_method: Optional[ClusteringScoringMethod],
                                    cross_validation_folds: int, more_is_better: bool) -> Tuple[float, SurvModel]:
    """Computes clustering or CV algorithm depending on the parameters. Return avg fitness value and best model."""
    if is_clustering:
        current_mean_score, current_best_model, _best_score = __compute_clustering_sequential(
            classifier,
            subset,
            clinical_data,
            score_method=clustering_score_method,
            more_is_better=more_is_better
        )
    else:
        # SVM/RF
        current_mean_score, current_best_model, _best_score = __compute_cross_validation_sequential(
            classifier,
            subset,
            clinical_data,
            cross_validation_folds,
            more_is_better=more_is_better  # False is only for Clustering Log-Likelihood metric, not for C-Index
        )

    return current_mean_score, current_best_model


def binary_black_hole_sequential(
        classifier: SurvModel,
        molecules_df: pd.DataFrame,
        n_stars: int,
        n_iterations: int,
        clinical_data: np.ndarray,
        is_clustering: bool,
        clustering_score_method: Optional[ClusteringScoringMethod],
        cross_validation_folds: int,
        binary_threshold: Optional[float] = 0.6
) -> FSResult:
    """
    Computes the metaheuristic Binary Black Hole Algorithm. Taken from the paper
    "Binary black hole algorithm for feature selection and classification on biological data"
    Authors: Elnaz Pashaei, Nizamettin Aydin.
    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules' data.
    @param n_stars: Number of stars in the BBHA.
    @param n_iterations: Number of iterations in the BBHA.
    @param clinical_data: Numpy array with the time and event columns.
    @param is_clustering: If True, no CV is computed as clustering needs all the samples to make predictions.
    @param clustering_score_method: Clustering scoring method to optimize.
    @param cross_validation_folds: Number of folds in the CrossValidation process.
    @param binary_threshold: Binary threshold to set 1 or 0 the feature. If None it'll be computed randomly.
    @return: The combination of features with the highest fitness score and the highest fitness score achieved by
    any combination of features.
    """
    # Data structs setup
    n_features = len(molecules_df.index)

    # In case n_stars is bigger than possible combinations...
    n_possible_combinations = factorial(n_features)
    if n_stars > n_possible_combinations:
        n_stars = int(n_possible_combinations)

    stars_subsets = np.empty((n_stars, n_features), dtype=int)
    stars_fitness_values = np.empty((n_stars,), dtype=float)
    stars_model = np.empty((n_stars,), dtype=object)

    # In case of negative Log-likelihood (only used in clustering). If it is lower, better!
    more_is_better = not is_clustering or clustering_score_method != ClusteringScoringMethod.LOG_LIKELIHOOD

    # Initializes the stars with their subsets and their fitness values
    for i in range(n_stars):
        random_features_to_select = get_random_subset_of_features_bbha(n_features)
        stars_subsets[i] = random_features_to_select  # Initialize 'Population'
        subset_to_predict = get_subset_of_features(molecules_df, combination=stars_subsets[i])
        mean_score, initial_best_model = __compute_bbha_fitness_function(classifier, subset_to_predict,
                                                                         clinical_data, is_clustering,
                                                                         clustering_score_method,
                                                                         cross_validation_folds, more_is_better)

        stars_fitness_values[i] = mean_score
        stars_model[i] = initial_best_model

    # The star with the best fitness is the Black Hole
    black_hole_idx, best_features, best_mean_score = get_best_bbha(stars_subsets, stars_fitness_values, more_is_better)
    best_model: SurvModel = stars_model[black_hole_idx]

    # Iterations
    for i in range(n_iterations):
        for a in range(n_stars):
            # If it's the black hole, skips the computation
            if a == black_hole_idx:
                continue

            # Computes the current star fitness
            current_star_combination = stars_subsets[a]
            subset = get_subset_of_features(molecules_df, combination=current_star_combination)
            current_mean_score, current_best_model = __compute_bbha_fitness_function(classifier, subset, clinical_data,
                                                                                     is_clustering,
                                                                                     clustering_score_method,
                                                                                     cross_validation_folds,
                                                                                     more_is_better)

            # If it's the best fitness, swaps that star with the current black hole
            if (more_is_better and current_mean_score > best_mean_score) or \
                    (not more_is_better and current_mean_score < best_mean_score):
                print(f"New best score: {current_mean_score} | Old best score: {best_mean_score}")
                black_hole_idx = a
                best_features, current_star_combination = current_star_combination, best_features
                best_mean_score, current_mean_score = current_mean_score, best_mean_score
                best_model = current_best_model

            # If the fitness function was the same, but had fewer features in the star (better!), makes the swap
            elif current_mean_score == best_mean_score and np.count_nonzero(current_star_combination) < np.count_nonzero(
                    best_features):
                black_hole_idx = a
                best_features, current_star_combination = current_star_combination, best_features
                best_mean_score, current_mean_score = current_mean_score, best_mean_score

            # Computes the event horizon
            event_horizon = best_mean_score / np.sum(stars_fitness_values)

            # Checks if the current star falls in the event horizon
            dist_to_black_hole = np.linalg.norm(best_features - current_star_combination)  # Euclidean distance
            if dist_to_black_hole < event_horizon:
                stars_subsets[a] = get_random_subset_of_features_bbha(n_features)

        # Updates the binary array of the used features
        for a in range(n_stars):
            # Skips the black hole
            if black_hole_idx == a:
                continue

            for d in range(n_features):
                x_old = stars_subsets[a][d]
                threshold = binary_threshold if binary_threshold is not None else random.uniform(0, 1)
                x_new = x_old + random.uniform(0, 1) * (best_features[d] - x_old)  # Position
                stars_subsets[a][d] = 1 if abs(tanh(x_new)) > threshold else 0

    best_features = best_features.astype(bool)  # Pandas needs a boolean array to select the rows
    best_features_str: List[str] = molecules_df.iloc[best_features].index.tolist()
    return best_features_str, best_model, best_mean_score


def select_top_cox_regression(molecules_df: pd.DataFrame, clinical_data: np.ndarray,
                              filter_zero_coeff: bool, top_n: Optional[int]) -> CoxNetAnalysisResult:
    """
    Get the top features using CoxNetSurvivalAnalysis model. It uses a GridSearch with Cross Validation to get the best
    alpha parameter and the filters the best features sorting by coefficients.
    Taken from https://scikit-survival.readthedocs.io/en/stable/user_guide/coxnet.html#Elastic-Net.
    TODO: check if can make predictions with this model
    @param molecules_df: DataFrame with all the molecules' data.
    @param clinical_data: Numpy array with the time and event columns.
    @param filter_zero_coeff: If True removes features with coefficient == 0.
    @param top_n: Top N features to keep.
    @return: The combination of features with the highest fitness score and the highest fitness score achieved by
    any None as no fitness value is got from this CoxRegression process.
    """
    # NOTE: molecules have to be as columns
    x = molecules_df.transpose()

    cox_net_pipe = make_pipeline(
        StandardScaler(),
        CoxnetSurvivalAnalysis(l1_ratio=0.9, alpha_min_ratio=0.01, max_iter=100)
    )

    # Fits to get alphas (ignoring some GridSearch warnings)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        warnings.simplefilter("ignore", FitFailedWarning)
        cox_net_pipe.fit(x, clinical_data)

    # Gets alphas to compute the GridSearch
    estimated_alphas_np = np.array(cox_net_pipe.named_steps["coxnetsurvivalanalysis"].alphas_)

    # To improve performance. Generates a list of at most 3 items consisting of the minimum value,
    # the mean and the maximum
    estimated_alphas = []
    if len(estimated_alphas_np) > 3:
        estimated_alphas.append(np.min(estimated_alphas_np))
        estimated_alphas.append(np.median(estimated_alphas_np))
        estimated_alphas.append(np.max(estimated_alphas_np))
    else:
        estimated_alphas = estimated_alphas_np.tolist()

    cv = StratifiedKFold(n_splits=3, shuffle=True)
    gcv = GridSearchCV(
        make_pipeline(StandardScaler(), CoxnetSurvivalAnalysis(l1_ratio=0.9)),
        param_grid={"coxnetsurvivalanalysis__alphas": [[v] for v in estimated_alphas]},
        cv=cv,
        error_score=0.5,
        n_jobs=settings.COX_NET_GRID_SEARCH_N_JOBS
    ).fit(x, clinical_data)

    # Keeps best model from the GridSearch
    best_model = gcv.best_estimator_.named_steps["coxnetsurvivalanalysis"]
    best_coefficients = pd.DataFrame(
        best_model.coef_,
        index=x.columns,
        columns=["coefficient"]
    )

    # If specified filter zero coefficients
    if filter_zero_coeff:
        best_coefficients = best_coefficients.query("coefficient != 0")

    # Gets best features sorted by coefficient
    coefficients_order = best_coefficients.abs().sort_values("coefficient").index
    res_df: pd.DataFrame = best_coefficients.loc[coefficients_order]

    best_features = res_df.index.tolist()
    best_features_coeff: List[float] = res_df['coefficient'].tolist()
    if top_n:
        best_features = best_features[:top_n]
        best_features_coeff = best_features_coeff[:top_n]

    return best_features, None, best_features_coeff
