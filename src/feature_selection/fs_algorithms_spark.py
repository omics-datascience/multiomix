from typing import Optional
import numpy as np
import pandas as pd
from feature_selection.fs_algorithms import FSResult
from feature_selection.models import ClusteringScoringMethod, FitnessFunction


def blind_search_spark(
        classifier: FitnessFunction,
        molecules_df: pd.DataFrame,
        clinical_data: np.ndarray,
        is_clustering: bool,
        clustering_score_method: Optional[ClusteringScoringMethod]) -> FSResult:
    """
    Runs a Blind Search running a specific classifier using the molecular and clinical data passed by params. This
    is the same as blind_search_sequential but this runs on an AWS Spark Cluster.
    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules' data.
    @param clinical_data: Numpy array with the time and event columns.
    @param is_clustering: If True, no CV is computed as clustering needs all the samples to make predictions.
    @param clustering_score_method: Clustering scoring method to optimize.
    @return: The combination of features with the highest fitness score and the highest fitness score achieved by
    any combination of features.
    """
    pass


def binary_black_hole_spark(
        classifier: FitnessFunction,
        molecules_df: pd.DataFrame,
        n_stars: int,
        n_iterations: int,
        clinical_data: np.ndarray,
        is_clustering: bool,
        clustering_score_method: Optional[ClusteringScoringMethod],
        binary_threshold: Optional[float] = 0.6
) -> FSResult:
    """
    Computes the metaheuristic Binary Black Hole Algorithm. Taken from the paper
    "Binary black hole algorithm for feature selection and classification on biological data"
    Authors: Elnaz Pashaei, Nizamettin Aydin. This is the same as binary_black_hole_sequential but this runs on an AWS
    Spark Cluster.
    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules' data.
    @param n_stars: Number of stars in the BBHA.
    @param n_iterations: Number of iterations in the BBHA.
    @param clinical_data: Numpy array with the time and event columns.
    @param is_clustering: If True, no CV is computed as clustering needs all the samples to make predictions.
    @param clustering_score_method: Clustering scoring method to optimize.
    @param binary_threshold: Binary threshold to set 1 or 0 the feature. If None it'll be computed randomly.
    @return: The combination of features with the highest fitness score and the highest fitness score achieved by
    any combination of features.
    """
    pass
