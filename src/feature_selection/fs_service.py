from typing import Dict, Tuple, Any
import numpy as np
from django.conf import settings
from biomarkers.models import BiomarkerState, TrainedModelState
from common.datasets_utils import get_common_samples, generate_molecules_file, format_data, generate_clinical_file, \
    check_sample_classes
from common.exceptions import ExperimentStopped
from common.functions import check_if_stopped
from common.typing import AbortEvent
from common.utils import limit_between_min_max
from .fs_algorithms import blind_search_sequential, binary_black_hole_sequential, select_top_cox_regression
from .fs_algorithms_spark import binary_black_hole_spark
from .models import FSExperiment, FitnessFunction, FeatureSelectionAlgorithm, TrainedModel, \
    BBHAParameters, CoxRegressionParameters
from .utils import save_model_dump_and_best_score, create_models_parameters_and_classifier, save_molecule_identifiers


# Common event values
COMMON_INTEREST_VALUES = ['DEAD', 'DECEASE', 'DEATH']


def __generate_df_molecules_and_clinical(experiment: FSExperiment,
                                         samples_in_common: np.ndarray) -> Tuple[str, str]:
    """
    Generates two DataFrames: one with all the selected molecules, and other with the selected clinical data.
    @param experiment: FSExperiment instance to extract molecules and clinical data from its sources.
    @param samples_in_common: Samples in common to extract from the datasets.
    @return: Both DataFrames paths.
    """
    # Generates clinical DataFrame
    # TODO: implement the selection of the survival tuple from the frontend
    survival_tuple = experiment.clinical_source.get_survival_columns().first()
    clinical_temp_file_path = generate_clinical_file(experiment, samples_in_common, survival_tuple)

    # Generates molecules DataFrame
    molecules_temp_file_path = generate_molecules_file(experiment, samples_in_common)

    return molecules_temp_file_path, clinical_temp_file_path


def __should_run_in_spark(n_agents: int, n_iterations: int) -> bool:
    """
    Return True if the number of combinations to be executed is greater than or equal to the
    threshold (MIN_COMBINATIONS_SPARK parameter).
    @param n_agents: Number of agents in the metaheuristic.
    @param n_iterations: Number of iterations in the metaheuristic.
    @return: True if the number of combinations to be executed is greater than or equal to the threshold.
    """
    return n_agents * n_iterations >= settings.MIN_COMBINATIONS_SPARK

def __compute_fs_experiment(experiment: FSExperiment, molecules_temp_file_path: str,
                            clinical_temp_file_path: str, fit_fun_enum: FitnessFunction,
                            fitness_function_parameters: Dict[str, Any],
                            algorithm_parameters: Dict[str, Any],
                            cross_validation_parameters: Dict[str, Any], is_aborted: AbortEvent) -> bool:
    """
    Computes the Feature Selection experiment using the params defined by the user.
    @param experiment: FSExperiment instance.
    @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
    @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
    @param fit_fun_enum: Selected fitness function to compute.
    @param fitness_function_parameters: Parameters of the fitness function to compute.
    @param algorithm_parameters: Parameters of the FS algorithm (Blind Search, BBHA, PSO, etc.) to compute.
    @param cross_validation_parameters: Parameters of the CrossValidation process.
    @param is_aborted: Method to call to check if the experiment has been stopped.
    @return A flag to indicate whether the experiment is running in spark
    """
    # Creates TrainedModel instance
    cross_validation_folds = int(cross_validation_parameters['folds'])
    cross_validation_folds = limit_between_min_max(cross_validation_folds, min_value=3, max_value=10)

    trained_model: TrainedModel = TrainedModel.objects.create(
        name=f'From FS for biomarker {experiment.created_biomarker.name}',
        biomarker=experiment.created_biomarker,
        fitness_function=fit_fun_enum,
        state=BiomarkerState.IN_PROCESS,
        cross_validation_folds=cross_validation_folds,
        fs_experiment=experiment
    )

    # Gets model instance and stores its parameters
    classifier, clustering_scoring_method, is_clustering, is_regression = create_models_parameters_and_classifier(
        trained_model, fitness_function_parameters
    )

    # Gets data in the correct format
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_df, clinical_df, clinical_data = format_data(molecules_temp_file_path, clinical_temp_file_path,
                                                           is_regression)

    # Checks if there are fewer samples than splits in the CV to prevent ValueError
    check_if_stopped(is_aborted, ExperimentStopped)
    check_sample_classes(trained_model, clinical_data, cross_validation_folds)

    # Gets FS algorithm
    # TODO: send is_aborted to all the algorithms!
    if experiment.algorithm == FeatureSelectionAlgorithm.BLIND_SEARCH:
        check_if_stopped(is_aborted, ExperimentStopped)
        best_features, best_model, best_score = blind_search_sequential(classifier, molecules_df, clinical_data,
                                                                        is_clustering, clustering_scoring_method,
                                                                        trained_model.cross_validation_folds)
    elif experiment.algorithm == FeatureSelectionAlgorithm.BBHA:
        check_if_stopped(is_aborted, ExperimentStopped)

        bbha_parameters = algorithm_parameters['BBHA']
        n_stars = int(bbha_parameters['numberOfStars'])
        n_bbha_iterations = int(bbha_parameters['numberOfIterations'])
        bbha_version = int(bbha_parameters['BBHAVersion'])
        use_spark = bbha_parameters['useSpark']

        # Creates an instance of BBHAParameters
        BBHAParameters.objects.create(
            fs_experiment=experiment,
            n_stars=n_stars,
            n_iterations=n_bbha_iterations,
            version_used=bbha_version
        )

        if settings.ENABLE_AWS_EMR_INTEGRATION and use_spark and \
                __should_run_in_spark(n_agents=n_stars, n_iterations=n_bbha_iterations):
            check_if_stopped(is_aborted, ExperimentStopped)

            app_name = f'BBHA_{experiment.pk}'
            job_id = binary_black_hole_spark(
                job_name=f'Job for FSExperiment: {experiment.pk}',
                app_name=app_name,
                molecules_df=molecules_df,
                clinical_df=clinical_df,
                trained_model=trained_model,
                n_stars=n_stars,
                n_iterations=n_bbha_iterations,
            )

            # Saves the job id in the experiment
            experiment.app_name = app_name
            experiment.emr_job_id = job_id
            experiment.save(update_fields=['app_name', 'emr_job_id'])

            # It doesn't need to wait anything because the job is running in the AWS cluster right now
            return True  # Indicates that the experiment is running in AWS
        else:
            # Runs sequential version
            check_if_stopped(is_aborted, ExperimentStopped)

            best_features, best_model, best_score = binary_black_hole_sequential(
                classifier,
                molecules_df,
                n_stars=n_stars,
                n_iterations=n_bbha_iterations,
                clinical_data=clinical_data,
                is_clustering=is_clustering,
                clustering_score_method=clustering_scoring_method,
                cross_validation_folds=trained_model.cross_validation_folds
            )
    elif experiment.algorithm == FeatureSelectionAlgorithm.COX_REGRESSION:
        check_if_stopped(is_aborted, ExperimentStopped)

        cox_regression_parameters = algorithm_parameters['coxRegression']
        if cox_regression_parameters['topN']:
            top_n = int(cox_regression_parameters['topN'])
            top_n = limit_between_min_max(top_n, 1, len(molecules_df.columns))
        else:
            top_n = None

        # Creates an instance of CoxRegressionParameters
        CoxRegressionParameters.objects.create(
            fs_experiment=experiment,
            top_n=top_n
        )

        best_features, best_model, best_score = select_top_cox_regression(
            molecules_df,
            clinical_data,
            filter_zero_coeff=True, # Keeps only != 0 coefficient
            top_n=top_n
        )
    else:
        # TODO: implement PSO and GA
        raise Exception('Algorithm not implemented')

    if best_features is not None:
        # Stores molecules in the target biomarker, the best model and its fitness value
        check_if_stopped(is_aborted, ExperimentStopped)
        save_molecule_identifiers(experiment.created_biomarker, best_features)

        trained_model.state = TrainedModelState.COMPLETED

        # Stores the trained model and best score
        if best_model is not None and best_score is not None:
            save_model_dump_and_best_score(trained_model, best_model, best_score)
    else:
        trained_model.state = TrainedModelState.NO_FEATURES_FOUND

    trained_model.save(update_fields=['state'])

    return False  # It is not running in spark


def prepare_and_compute_fs_experiment(experiment: FSExperiment, fit_fun_enum: FitnessFunction,
                                        fitness_function_parameters: Dict[str, Any],
                                        algorithm_parameters: Dict[str, Any],
                                        cross_validation_parameters: Dict[str, Any],
                                        is_aborted: AbortEvent) -> Tuple[str, str, bool]:
    """
    Gets samples in common, generates needed DataFrames and finally computes the Feature Selection experiment.
    @param experiment: FSExperiment instance.
    @param fit_fun_enum: Selected fitness function to compute.
    @param fitness_function_parameters: Parameters of the fitness function to compute.
    @param algorithm_parameters: Parameters of the FS algorithm (Blind Search, BBHA, PSO, etc.) to compute.
    @param cross_validation_parameters: Parameters of the CrossValidation process.
    @param is_aborted: Method to call to check if the experiment has been stopped.
    @return Both molecules and clinical files paths.
    """
    # Get samples in common
    check_if_stopped(is_aborted, ExperimentStopped)
    samples_in_common = get_common_samples(experiment)

    # Generates needed DataFrames
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_temp_file_path, clinical_temp_file_path = __generate_df_molecules_and_clinical(
        experiment,
        samples_in_common
    )

    check_if_stopped(is_aborted, ExperimentStopped)
    running_in_spark = __compute_fs_experiment(experiment, molecules_temp_file_path, clinical_temp_file_path,
                                                    fit_fun_enum, fitness_function_parameters,
                                                    algorithm_parameters, cross_validation_parameters, is_aborted)

    return molecules_temp_file_path, clinical_temp_file_path, running_in_spark
