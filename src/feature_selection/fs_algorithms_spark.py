from enum import Enum
from typing import Optional
import numpy as np
import pandas as pd
import requests
from feature_selection.fs_algorithms import FSResult
from feature_selection.models import ClusteringScoringMethod, FitnessFunction
from multiomics_intermediate import settings


class EMRAlgorithms(Enum):
    BLIND_SEARCH = 0
    BBHA = 1


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
    #  - An environment variable that stores the microservice url. 
    #    By default "multiomix-aws-emr"
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
    #      ~ entrypoint_arguments: array of json objects that will be pased 
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
        classifier: FitnessFunction,
        molecules_df: pd.DataFrame,
        n_stars: int,
        n_iterations: int,
        clinical_df: pd.DataFrame,
        is_clustering: bool,
        clustering_score_method: Optional[ClusteringScoringMethod],
        binary_threshold: Optional[float] = 0.6
) -> int:
    """
    Computes the metaheuristic Binary Black Hole Algorithm. Taken from the paper
    "Binary black hole algorithm for feature selection and classification on biological data"
    Authors: Elnaz Pashaei, Nizamettin Aydin. This is the same as binary_black_hole_sequential but this runs on an AWS
    Spark Cluster.
    TODO: use all the params and remove the comments.
    @param job_name: Name of the job.
    @param classifier: Classifier to use in every blind search iteration.
    @param molecules_df: DataFrame with all the molecules' data.
    @param n_stars: Number of stars in the BBHA.
    @param n_iterations: Number of iterations in the BBHA.
    @param clinical_df: Numpy array with the time and event columns.
    @param is_clustering: If True, no CV is computed as clustering needs all the samples to make predictions.
    @param clustering_score_method: Clustering scoring method to optimize.
    @param binary_threshold: Binary threshold to set 1 or 0 the feature. If None it'll be computed randomly.
    @return: Job id in the EMR Spark cluster.
    @raise Exception: If the request raised an exception.
    """

    # Pre-requirements
    # ****************
    #  - An environment variable that stores the microservice url.
    #    By default "multiomix-aws-emr"
    #  - Communication with microservice endpoint. (Infrastructure side)
    #  - Shared "/data-spark" volume with microservice. (Infrastructure side)
    emr_settings = settings.AWS_EMR_SETTINGS

    # Saves molecules_df and clinical_df in the shared volume with the microservice
    shared_folder = emr_settings['shared_folder']

    # Dataset dump
    # ************
    #  - Save clinical_data dataset inside the shared volume, the path for that
    #    file will be passed to the microservice to lookup in the shared
    #    volume. Important, take care that the mount path for the volume
    #    can be different in multiomix and the middleware, knowing this,
    #    the path should be relative from the mount point.

    # TODO: uncomment when implemented
    # molecules_df.to_csv(os.path.join(shared_folder, 'molecules_df.csv'), sep=',', decimal='.')
    # clinical_df.to_csv(os.path.join(shared_folder, 'clinical_df.csv'), sep=',', decimal='.')

    # AWS-EMR middleware microservice communication
    # *********************************************
    #   
    #  Usage for binary_black_hole_spark
    #  ********************************
    #    - @Protocol HTTP
    #    - @Verb POST
    #    - @URI /job
    #    - @Headers
    #      ~ Content-Type = application/json    
    #    - @Body json object
    #      ~ name: job name for emr (str,optional)
    #      ~ algorithm: 1 (int,optional, default 0)
    #      ~ entrypoint_arguments: array of json objects that will be pased 
    #                              as args to the main python script in spark.
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
    # Makes a request to the EMR microservice to run the binary black hole algorithm.
    url = f'http://{emr_settings["host"]}:{emr_settings["port"]}/job'
    response = requests.post(url, json={
        'name': job_name,
        'algorithm': EMRAlgorithms.BBHA.value,
        'entrypoint_arguments': [
            {
                'name': 'svm-kernel',
                'value': 'poly',
            },
            {
                'name': 'molecules-dataset',
                'value': 'molecules.csv',
            },
            {
                'name': 'clinical-dataset',
                'value': 'clinical.csv',
            }
        ]
    })

    # If it's a 500 error, raise an exception
    response.raise_for_status()

    # Otherwise, gets the job id from the response
    job_id = response.json()['id']

    # Recap
    # *****
    #   1 - Save dataset file in shared volume.
    #   2 - Build entrypoint arguments array.
    #   3 - Create the request body.
    #     3.1 - Set algorithm equals 1.
    #     3.2 - Assign entrypoint_arguments to array created in step 2.
    #   4 - Create HTTP request.
    #     4.1 - Set Verb POST
    #     4.2 - Set Host {AWS-EMR middleware microservice URL}/job
    #     4.3 - Set Headers
    #   5 - Send request.
    #   6 - Handle response.
    
    return job_id