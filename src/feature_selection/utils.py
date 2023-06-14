import pickle
import random
from typing import Optional, Union, List, Tuple, Dict
import numpy as np
from django.core.files.base import ContentFile
from rest_framework.exceptions import ValidationError
from biomarkers.models import Biomarker, MRNAIdentifier, MiRNAIdentifier, CNAIdentifier, MethylationIdentifier
from common.utils import limit_between_min_max
from feature_selection.fs_models import SVMKernelOptions, get_survival_svm_model, get_rf_model, get_clustering_model
from feature_selection.models import SVMKernel, TrainedModel, FitnessFunction, ClusteringScoringMethod, SVMParameters, \
    SVMTask, ClusteringParameters, RFParameters
from user_files.models_choices import FileType


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


def create_models_parameters_and_classifier(
        trained_model: TrainedModel,
        models_parameters: Dict
) -> Tuple['SurvModel', ClusteringScoringMethod, bool, bool]:
    """
    Generates the corresponding instances of models parameters and gets the corresponding classifier instances
    depending on the selected FitnessFunction.
    @param trained_model: TrainedModel instance.
    @param models_parameters: Dictionary with parameters
    @return: A classifier instance, the clustering scoring method, and two flags to indicate if it's an scoring
    fitness function, and a regression task.
    @raise Validation error if some parameter is invalid.
    """
    is_clustering = False
    is_regression = False
    clustering_scoring_method: Optional[ClusteringScoringMethod] = None
    fitness_function = trained_model.fitness_function

    # TODO: refactor all the parameters retrieval
    if fitness_function == FitnessFunction.SVM:
        # Creates SVMParameters instance
        models_parameters = models_parameters['svmParameters']
        task = int(models_parameters['task'])
        kernel = int(models_parameters['kernel'])
        max_iterations = int(models_parameters['maxIterations']) if models_parameters['maxIterations'] else 1000
        max_iterations = limit_between_min_max(max_iterations, min_value=100, max_value=2000)
        random_state = int(models_parameters['randomState']) if models_parameters['randomState'] else None
        is_regression = task == SVMTask.REGRESSION

        svm_parameters: SVMParameters = SVMParameters.objects.create(
            kernel=kernel,
            task=task,
            max_iterations=max_iterations,
            random_state=random_state,
            trained_model=trained_model
        )
        classifier = get_survival_svm_model(
            is_svm_regression=svm_parameters.task == SVMTask.REGRESSION,
            svm_kernel=get_svm_kernel(svm_parameters.kernel),
            max_iterations=svm_parameters.max_iterations,
            random_state=svm_parameters.random_state,
            svm_optimizer='avltree'  # In practice, this optimizer is usually the fastest
        )
    elif trained_model.fitness_function == FitnessFunction.RF:
        is_regression = True  # RF only can make regression tasks
        models_parameters = models_parameters['rfParameters']
        n_estimators = int(models_parameters['nEstimators'])
        n_estimators = limit_between_min_max(n_estimators, min_value=10, max_value=20)
        random_state = int(models_parameters['randomState']) if models_parameters['randomState'] else None
        max_depth = int(models_parameters['maxDepth']) if models_parameters['maxDepth'] else None

        rm_parameters: RFParameters = RFParameters.objects.create(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            trained_model=trained_model
        )
        classifier = get_rf_model(n_estimators=rm_parameters.n_estimators, max_depth=rm_parameters.max_depth,
                                  random_state=rm_parameters.random_state)
    elif trained_model.fitness_function == FitnessFunction.CLUSTERING:
        # Clustering selected
        is_clustering = True

        # Creates ClusteringParameters instance
        models_parameters = models_parameters['clusteringParameters']
        n_clusters = int(models_parameters['nClusters'])
        n_clusters = limit_between_min_max(n_clusters, min_value=2, max_value=10)
        random_state = int(models_parameters['randomState']) if models_parameters['randomState'] else None

        clustering_parameters: ClusteringParameters = ClusteringParameters.objects.create(
            algorithm=int(models_parameters['algorithm']),
            metric=int(models_parameters['metric']),
            n_clusters=n_clusters,
            scoring_method=int(models_parameters['scoringMethod']),
            random_state=random_state,
            trained_model=trained_model
        )

        clustering_scoring_method = clustering_parameters.scoring_method
        classifier = get_clustering_model(clustering_parameters.algorithm,
                                          number_of_clusters=clustering_parameters.n_clusters,
                                          random_state=clustering_parameters.random_state)
    else:
        raise ValidationError(f'Parameter fitness_function invalid: {fitness_function} ({type(fitness_function)})')

    return classifier, clustering_scoring_method, is_clustering, is_regression


def save_model_dump_and_best_score(trained_model: TrainedModel, best_model: 'SurvModel', best_score: float):
    """Saves a model instance and best score in a TrainedModel instance."""
    trained_content = pickle.dumps(best_model)
    trained_content_as_file = ContentFile(trained_content)
    trained_model.model_dump.save(
        f'{trained_model.pk}_trained_model_dump.pkl',
        trained_content_as_file,
        save=False
    )
    trained_model.best_fitness_value = best_score
    trained_model.save(update_fields=['model_dump', 'best_fitness_value'])


def save_molecule_identifiers(created_biomarker: Biomarker, best_features: List[str]):
    """Saves all the molecules for the new created biomarker."""
    for feature in best_features:
        molecule_name, file_type = feature.rsplit('_', maxsplit=1)
        file_type = int(file_type)
        if file_type == FileType.MRNA:
            identifier_class = MRNAIdentifier
        elif file_type == FileType.MIRNA:
            identifier_class = MiRNAIdentifier
        elif file_type == FileType.CNA:
            identifier_class = CNAIdentifier
        elif file_type == FileType.METHYLATION:
            identifier_class = MethylationIdentifier
        else:
            raise Exception(f'Molecule type invalid: {file_type}')

        # Creates the identifier
        identifier_class.objects.create(identifier=molecule_name, biomarker=created_biomarker)
