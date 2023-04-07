from feature_selection.fs_models import SVMKernelOptions, SVMOptimizerOptions
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
