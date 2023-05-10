from typing import Literal, Union, Optional
from django.conf import settings
from sklearn.cluster import KMeans, SpectralClustering
from sksurv.ensemble import RandomSurvivalForest
from sksurv.svm import FastKernelSurvivalSVM
from .models import ClusteringAlgorithm

# Available options for the SVM kernel
SVMKernelOptions = Literal["linear", "poly", "rbf", "sigmoid", "cosine", "precomputed"]

# Available options for the SVM optimizer
SVMOptimizerOptions = Literal["avltree", "rbtree"]

# Available models for clustering
ClusteringModels = Union[KMeans, SpectralClustering]


def get_clustering_model(clustering_algorithm: ClusteringAlgorithm,
                         number_of_clusters: int) -> ClusteringModels:
    """
    Generates a clustering model with some specific parameters.
    @param clustering_algorithm: ClusteringAlgorithm enum value.
    @param number_of_clusters: Number of clusters to generate.
    @return: a clustering model instance.
    """
    if clustering_algorithm == ClusteringAlgorithm.K_MEANS:
        return KMeans(n_clusters=number_of_clusters)
    elif clustering_algorithm == ClusteringAlgorithm.SPECTRAL:
        return SpectralClustering(n_clusters=number_of_clusters)

    raise Exception(f'Invalid clustering_algorithm parameter: {clustering_algorithm}')


def get_rf_model(n_estimators: int, max_depth: Optional[int], random_state: Optional[float]) -> RandomSurvivalForest:
    """
    Generates a RandomSurvivalForest instance with some specific parameters.
    @param n_estimators: Number of trees in the forest.
    @param random_state: Random state to use.
    @param max_depth: The maximum depth of the tree. If None, then nodes are expanded until all leaves are pure or
    until all leaves contain less than min_samples_split samples.
    @return: a RandomSurvivalForest instance.
    """
    return RandomSurvivalForest(n_estimators=n_estimators, min_samples_split=10, min_samples_leaf=15,
                                max_features="sqrt", n_jobs=settings.N_JOBS_RF, max_depth=max_depth,
                                random_state=random_state)


def get_survival_svm_model(is_svm_regression: bool, svm_kernel: SVMKernelOptions, svm_optimizer: SVMOptimizerOptions,
                           max_iterations: int, random_state: Optional[float]) -> FastKernelSurvivalSVM:
    """
    Generates a FastKernelSurvivalSVM instance with some specific parameters.
    @return: a FastKernelSurvivalSVM instance.
    """
    rank_ratio = 0.0 if is_svm_regression else 1.0
    return FastKernelSurvivalSVM(rank_ratio=rank_ratio, max_iter=max_iterations, tol=1e-5, kernel=svm_kernel,
                                 optimizer=svm_optimizer, random_state=random_state)
