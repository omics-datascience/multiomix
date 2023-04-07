from typing import Literal
from django.conf import settings
from sksurv.ensemble import RandomSurvivalForest
from sksurv.svm import FastKernelSurvivalSVM


# Available options for the SVM kernel
SVMKernelOptions = Literal["linear", "poly", "rbf", "sigmoid", "cosine", "precomputed"]

# Available options for the SVM optimizer
SVMOptimizerOptions = Literal["avltree", "rbtree"]


def get_rf_model(rf_n_estimators: int = 50) -> RandomSurvivalForest:
    """
    Generates a RandomSurvivalForest instance with some specific parameters.
    @return: a RandomSurvivalForest instance.
    """
    return RandomSurvivalForest(n_estimators=rf_n_estimators, min_samples_split=10, min_samples_leaf=15,
                                max_features="sqrt", n_jobs=settings.N_JOBS_RF)


def get_survival_svm_model(is_svm_regression: bool, svm_kernel: SVMKernelOptions, svm_optimizer: SVMOptimizerOptions,
                           max_iterations: int = 1000) -> FastKernelSurvivalSVM:
    """
    Generates a FastKernelSurvivalSVM instance with some specific parameters.
    @return: a FastKernelSurvivalSVM instance.
    """
    rank_ratio = 0.0 if is_svm_regression else 1.0
    return FastKernelSurvivalSVM(rank_ratio=rank_ratio, max_iter=max_iterations, tol=1e-5, kernel=svm_kernel,
                                 optimizer=svm_optimizer)
