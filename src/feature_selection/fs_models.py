from typing import Literal, Union
import numpy as np
import pandas as pd
from django.conf import settings
from sklearn.model_selection import cross_val_score
from sksurv.ensemble import RandomSurvivalForest
from sksurv.svm import FastKernelSurvivalSVM


# Available options for the SVM kernel
SVMKernel = Literal["linear", "poly", "rbf", "sigmoid", "cosine", "precomputed"]

# Available options for the SVM optimizer
SVMOptimizer = Literal["avltree", "rbtree"]


def get_rf_model(rf_n_estimators: int = 50) -> RandomSurvivalForest:
    """
    Generates a RandomSurvivalForest instance with some specific parameters.
    @return: a RandomSurvivalForest instance.
    """
    return RandomSurvivalForest(n_estimators=rf_n_estimators, min_samples_split=10, min_samples_leaf=15,
                                max_features="sqrt", n_jobs=settings.N_JOBS_RF)


def get_survival_svm_model(is_svm_regression: bool, svm_kernel: SVMKernel, svm_optimizer: SVMOptimizer,
                           max_iterations: int = 1000) -> FastKernelSurvivalSVM:
    """
    Generates a FastKernelSurvivalSVM instance with some specific parameters.
    @return: a FastKernelSurvivalSVM instance.
    """
    rank_ratio = 0.0 if is_svm_regression else 1.0
    return FastKernelSurvivalSVM(rank_ratio=rank_ratio, max_iter=max_iterations, tol=1e-5, kernel=svm_kernel,
                                 optimizer=svm_optimizer)


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
