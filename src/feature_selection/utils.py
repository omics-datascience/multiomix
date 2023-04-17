import random
from typing import Optional, Union, List, Tuple
import numpy as np
from feature_selection.fs_models import SVMKernelOptions
from feature_selection.models import SVMKernel


def get_svm_kernel(kernel: SVMKernel) -> SVMKernelOptions:
    """
    Gets a valid Scikit-surv learn parameter for the specific SVMKernel enum value.
    @param kernel: SVMKernel enum value.
    @return: Valid Scikit-surv learn parameter for the FastKernelSurvivalSVM model.
    """
    if kernel == SVMKernel.RBF:
        return 'rbf'
    if kernel == SVMKernel.POLYNOMIAL:
        return 'poly'
    return 'linear'  # Default is linear as if faster


def get_random_subset_of_features_bbha(n_features: int) -> np.ndarray:
    """
    Generates a random subset of Features. Answer taken from https://stackoverflow.com/a/47942584/7058363
    @param n_features: Total number of features
    @return: Categorical array with {0, 1} values indicate the absence/presence of the feature in the index
    """
    res = np.zeros(n_features, dtype=int)  # Gets an array of all the features in zero

    random_number_of_features = random.randint(1, n_features)
    res[:random_number_of_features] = 1
    np.random.shuffle(res)
    return res


def get_best_bbha(subsets: np.ndarray,
                  fitness_values: Union[np.ndarray, List[float]]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Get the best value of the fitness values."""
    best_idx = np.argmax(fitness_values)  # Keeps the idx to avoid ambiguous comparisons
    return best_idx, subsets[best_idx], fitness_values[best_idx]
