import os
from enum import Enum
from typing import Optional, Dict, cast, List
import numpy as np
import pandas as pd
import requests
from rest_framework.exceptions import ValidationError
from common.datasets_utils import create_folder_with_permissions
from common.utils import remove_non_alphanumeric_chars
from feature_selection.fs_algorithms import FSResult
from feature_selection.models import ClusteringScoringMethod, FitnessFunction, TrainedModel, SVMParameters, \
    RFParameters, ClusteringParameters, SVMKernel, ClusteringAlgorithm
from multiomics_intermediate import settings


class EMRAlgorithms(Enum):
    BLIND_SEARCH = 0
    BBHA = 1


def __get_kernel_value(kernel: SVMKernel) -> str:
    """Gets the corresponding string value for the parameter 'svm-kernel' of the EMR integration."""
    if kernel == SVMKernel.RBF:
        return 'rbf'
    if kernel == SVMKernel.POLYNOMIAL:
        return 'poly'
    return 'linear'  # Default is linear as if faster


def __get_model_value(fitness_function: FitnessFunction) -> str:
    """Gets the corresponding string value for the parameter 'model' of the EMR integration."""
    if fitness_function == FitnessFunction.SVM:
        return 'svm'
    if fitness_function == FitnessFunction.RF:
        return 'rf'
    return 'clustering'  # Default is clustering


def __get_clustering_algorithm_value(cluster_algorithm: ClusteringAlgorithm) -> str:
    """Gets the corresponding string value for the parameter 'clustering-algorithm' of the EMR integration."""
    if cluster_algorithm == ClusteringAlgorithm.SPECTRAL:
        return 'spectral'
    return 'k_means'  # Default is kmeans


def __get_clustering_scoring_value(scoring_method: ClusteringScoringMethod) -> str:
    """Gets the corresponding string value for the parameter 'clustering-scoring-method' of the EMR integration."""
    if scoring_method == ClusteringScoringMethod.C_INDEX:
        return 'concordance_index'
    return 'log_likelihood'  # Default is kmeans


def __create_models_parameters_for_request(trained_model: TrainedModel) -> List[Dict[str, str]]:
    """
    Generates the corresponding parameters in the 'entrypoint_arguments' parameter of the EMR algorithm.
    @param trained_model: TrainedModel instance.
    @return: A dictionary with the parameters to be used in the EMR algorithm.
    @raise Validation error if some parameter is invalid.
    """
    models_parameters = trained_model.get_model_parameter()
    if models_parameters is None:
        raise ValidationError(f'TrainedModel with pk {trained_model.pk} has not a valid model parameter.')

    fitness_function = trained_model.fitness_function
    result: List[Dict[str, str]]

    if fitness_function == FitnessFunction.SVM:
        models_parameters = cast(SVMParameters, models_parameters)
        result = [
            {
                'name': 'svm-kernel',
                'value': __get_kernel_value(models_parameters.kernel),
            },
            {
                'name': 'svm-optimizer',
                'value': 'avltree',
            },
            {
                'name': 'svm-max-iterations',
                'value': str(models_parameters.max_iterations),
            },
            {
                'name': 'svm-is-regression',
                'value': '',  # Boolean values are passed as empty string
            }
        ]
    elif trained_model.fitness_function == FitnessFunction.RF:
        models_parameters = cast(RFParameters, models_parameters)
        result = [
            {
                'name': 'rf-n-estimators',
                'value': models_parameters.n_estimators,
            }
        ]

    elif trained_model.fitness_function == FitnessFunction.CLUSTERING:
        models_parameters = cast(ClusteringParameters, models_parameters)
        # TODO: add 'metric' and 'penalizer' parameters
        result = [
            {
                'name': 'clustering-algorithm',
                'value': __get_clustering_algorithm_value(models_parameters.algorithm),
            },
            {
                'name': 'number-of-clusters',
                'value': str(models_parameters.n_clusters),
            },
            {
                'name': 'clustering-scoring-method',
                'value': __get_clustering_scoring_value(models_parameters.scoring_method),
            }
        ]
    else:
        raise ValidationError(f'Parameter fitness_function invalid: {fitness_function} ({type(fitness_function)})')

    # Appends some common parameters
    if models_parameters.random_state is not None:
        result.append({
            'name': 'random-state',
            'value': str(models_parameters.random_state)
        })

    return result


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

    # Pre-requirements
    # ****************
    #  - An environment variable that stores the microservice url. By default, "multiomix-aws-emr"
    #  - Communication with microservice endpoint. (Infrastructure side)
    #  - Shared volume with microservice. (Infrastructure side)
    #  - An environment variable that stores the dataset path (shared volume).

    # Dataset dump
    # ************
    #  - Save clinical_data dataset inside the shared volume, the path for that
    #    file will be passed to the microservice to lookup in the shared
    #    volume. Important, take care that the mount path for the volume
    #    can be different in multiomix and the middleware, knowing this,
    #    the path should be relative from the mount point.

    
    # AWS-EMR middleware microservice communication
    # *********************************************
    #   
    #  Usage for blind_search_algorithm
    #  ********************************
    #    - @Protocol HTTP
    #    - @Verb POST
    #    - @URI /job
    #    - @Headers
    #      ~ Content-Type = application/json    
    #    - @Body json object
    #      ~ name: job name for emr (str,optional)
    #      ~ algorithm: 0 (int,optional, default 0)
    #      ~ entrypoint_arguments: array of json objects that will be passed
    #                              as args to the main python script in EMR.
    #                              Structure of the obj should be { key:, value:}    
    #                              (array of json objects, default None)
    #                              Example:
    #                              [
    #                                {
    #                                  "name": "clinical_data",
    #                                  "value": "clinical_data file relative path"
    #                                },
    #                                {
    #                                  "name": "classifier",
    #                                  "value": "classifier value"
    #                                },
    #                                ...
    #                              ]    
    #    - @Response
    #        @Headers
    #          ~ Location: relative url for the new created job
    #        @Body json object
    #          ~ id: job id


    # Recap
    # *****
    #   1 - Save dataset file in shared volume.
    #   2 - Build entrypoint arguments array.
    #   3 - Create the request body.
    #     3.1 - Set algorithm equals 0.
    #     3.2 - Assign entrypoint_arguments to array created in step 2.
    #   4 - Create HTTP request.
    #     4.1 - Set Verb POST
    #     4.2 - Set Host {middleware microservice URL}/job
    #     4.3 - Set Headers
    #   5 - Send request.
    #   6 - Handle response.



    pass


def binary_black_hole_spark(
        job_name: str,
        app_name: str,
        molecules_df: pd.DataFrame,
        clinical_df: pd.DataFrame,
        trained_model: TrainedModel,
        n_stars: int,
        n_iterations: int,
) -> int:
    """
    Computes the metaheuristic Binary Black Hole Algorithm. Taken from the paper
    "Binary black hole algorithm for feature selection and classification on biological data"
    Authors: Elnaz Pashaei, Nizamettin Aydin. This is the same as binary_black_hole_sequential but this runs on an AWS
    Spark Cluster.
    @param job_name: Name of the job.
    @param app_name: Name of the app. In a folder with the same name the results will be stored.
    @param molecules_df: DataFrame with all the molecules' data.
    @param clinical_df: Numpy array with the time and event columns.
    @param trained_model: TrainedModel instance.
    @param n_stars: Number of stars in the BBHA.
    @param n_iterations: Number of iterations in the BBHA.
    @return: Job id in the EMR Spark cluster.
    @raise Exception: If the request raised an exception.
    """
    # Pre-requirements
    # ****************
    #  - An environment variable that stores the microservice url. By default, "multiomix-aws-emr"
    #  - Communication with microservice endpoint. (Infrastructure side)
    #  - Shared "/data-spark" volume with microservice. (Infrastructure side)
    emr_settings = settings.AWS_EMR_SETTINGS

    # Saves datasets inside the shared volume, the path for that file will be passed to the microservice
    # to lookup in the shared volume. IMPORTANT, take care that the mount path for the volume can be different in
    # multiomix and the middleware, knowing this, the path should be relative from the mount point.
    data_folder = emr_settings['shared_folder_data']
    app_data_folder = os.path.join(data_folder, app_name)
    create_folder_with_permissions(app_data_folder)

    # Saves datasets inside the shared volume
    molecules_path = os.path.join(app_data_folder, 'molecules.csv')
    molecules_df.to_csv(molecules_path, sep='\t', decimal='.')
    clinical_path = os.path.join(app_data_folder, 'clinical.csv')
    clinical_df.to_csv(clinical_path, sep='\t', decimal='.')

    # Gets relative paths to the shared volume for the EMR integration service
    molecules_relative_path = os.path.join(app_name, 'molecules.csv')
    clinical_relative_path = os.path.join(app_name, 'clinical.csv')

    # Prepares some parameters
    job_name = remove_non_alphanumeric_chars(job_name)
    entrypoint_arguments = [
        {
            'name': 'app-name',
            'value': app_name,
        },
        {
            'name': 'molecules-dataset',
            'value': molecules_relative_path,
        },
        {
            'name': 'clinical-dataset',
            'value': clinical_relative_path,
        },
        {
            'name': 'model',
            'value': __get_model_value(trained_model.fitness_function),
        },
        {
            'name': 'n-stars',
            'value': n_stars,
        },
        {
            'name': 'bbha-iterations',
            'value': n_iterations,
        }
    ]

    # Extends the entrypoint_arguments with the trained model parameters
    model_arguments = __create_models_parameters_for_request(trained_model)
    entrypoint_arguments.extend(model_arguments)

    # Makes a request to the EMR microservice to run the binary black hole algorithm.
    url = f'http://{emr_settings["host"]}:{emr_settings["port"]}/job'
    response = requests.post(url, json={
        'name': job_name,
        'algorithm': EMRAlgorithms.BBHA.value,
        'entrypoint_arguments': entrypoint_arguments
    })

    # If it's a 500 error, raise an exception
    response.raise_for_status()

    # Otherwise, gets the job id from the response
    job_id = response.json()['id']
    
    return job_id
