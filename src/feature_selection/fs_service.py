import os
import time
import numpy as np
from threading import Event
from typing import Dict, Tuple, Optional, Any
from biomarkers.models import BiomarkerState, Biomarker, BiomarkerOrigin, TrainedModelState
from common.utils import limit_between_min_max
from common.datasets_utils import get_common_samples, generate_molecules_file, format_data, generate_clinical_file, \
    check_sample_classes
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed, NumberOfSamplesFewerThanCVFolds
from .fs_algorithms import blind_search_sequential, binary_black_hole_sequential, select_top_cox_regression
from .fs_algorithms_spark import binary_black_hole_spark
from .models import FSExperiment, FitnessFunction, FeatureSelectionAlgorithm, SVMParameters, TrainedModel, \
    ClusteringParameters, BBHAParameters, CoxRegressionParameters
from concurrent.futures import ThreadPoolExecutor, Future
from pymongo.errors import ServerSelectionTimeoutError
import logging
from django.db.models import Q, QuerySet
from django.conf import settings
from django.db import connection
from common.functions import close_db_connection
from .utils import save_model_dump_and_best_score, create_models_parameters_and_classifier, save_molecule_identifiers

# Common event values
COMMON_INTEREST_VALUES = ['DEAD', 'DECEASE', 'DEATH']


class FSService(object):
    """
    Process Feature Selection experiments in a Thread Pool as explained
    at https://docs.python.org/3.8/library/concurrent.futures.html
    """
    executor: ThreadPoolExecutor = None
    use_transaction: bool
    fs_experiments_futures: Dict[int, Tuple[Future, Event]] = {}

    def __init__(self):
        # Instantiates the executor
        # IMPORTANT: ProcessPoolExecutor doesn't work well with Channels. It wasn't sending
        # websockets messages by some weird reason that I couldn't figure out. Let's use Threads instead of
        # processes
        self.executor = ThreadPoolExecutor(max_workers=settings.THREAD_POOL_SIZE)
        self.use_transaction = settings.USE_TRANSACTION_IN_EXPERIMENT
        self.fs_experiments_futures = {}

    def __commit_or_rollback(self, is_commit: bool, experiment: FSExperiment):
        """
        Executes a COMMIT or ROLLBACK sentence in DB. IMPORTANT: uses plain SQL as Django's autocommit
        management for transactions didn't work as expected with exceptions thrown in subprocesses.
        @param is_commit: If True, COMMIT is executed. ROLLBACK otherwise
        """
        if self.use_transaction:
            query = "COMMIT" if is_commit else "ROLLBACK"
            with connection.cursor() as cursor:
                cursor.execute(query)
        elif not is_commit:
            # Simulates a rollback removing all associated combinations
            logging.warning(f'Rolling back {experiment.pk} manually')
            start = time.time()
            # experiment.combinations.delete()  # TODO: implement when time data is stored
            logging.warning(f'Manual rollback of experiment {experiment.pk} -> {time.time() - start} seconds')

    @staticmethod
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

    @staticmethod
    def __should_run_in_spark(n_agents: int, n_iterations: int) -> bool:
        """
        Return True if the number of combinations to be executed is greater than or equal to the
        threshold (MIN_COMBINATIONS_SPARK parameter).
        @param n_agents: Number of agents in the metaheuristic.
        @param n_iterations: Number of iterations in the metaheuristic.
        @return: True if the number of combinations to be executed is greater than or equal to the threshold.
        """
        return n_agents * n_iterations >= settings.MIN_COMBINATIONS_SPARK

    def __compute_fs_experiment(self, experiment: FSExperiment, molecules_temp_file_path: str,
                                clinical_temp_file_path: str, fit_fun_enum: FitnessFunction,
                                fitness_function_parameters: Dict[str, Any],
                                algorithm_parameters: Dict[str, Any],
                                cross_validation_parameters: Dict[str, Any], stop_event: Event) -> bool:
        """
        Computes the Feature Selection experiment using the params defined by the user.
        TODO: use stop_event
        @param experiment: FSExperiment instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
        @param fit_fun_enum: Selected fitness function to compute.
        @param fitness_function_parameters: Parameters of the fitness function to compute.
        @param algorithm_parameters: Parameters of the FS algorithm (Blind Search, BBHA, PSO, etc) to compute.
        @param cross_validation_parameters: Parameters of the CrossValidation process.
        @param stop_event: Stop signal.
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
        molecules_df, clinical_df, clinical_data = format_data(molecules_temp_file_path, clinical_temp_file_path,
                                                               is_regression)

        # Checks if there are fewer samples than splits in the CV to prevent ValueError
        check_sample_classes(trained_model, clinical_data, cross_validation_folds)

        # Gets FS algorithm
        if experiment.algorithm == FeatureSelectionAlgorithm.BLIND_SEARCH:
            best_features, best_model, best_score = blind_search_sequential(classifier, molecules_df, clinical_data,
                                                                            is_clustering, clustering_scoring_method,
                                                                            trained_model.cross_validation_folds)
        elif experiment.algorithm == FeatureSelectionAlgorithm.BBHA:
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
                    self.__should_run_in_spark(n_agents=n_stars, n_iterations=n_bbha_iterations):
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
            save_molecule_identifiers(experiment.created_biomarker, best_features)

            trained_model.state = TrainedModelState.COMPLETED

            # Stores the trained model and best score
            if best_model is not None and best_score is not None:
                save_model_dump_and_best_score(trained_model, best_model, best_score)
        else:
            trained_model.state = TrainedModelState.NO_FEATURES_FOUND

        trained_model.save(update_fields=['state'])

        return False  # It is not running in spark

    def __prepare_and_compute_fs_experiment(self, experiment: FSExperiment, fit_fun_enum: FitnessFunction,
                                            fitness_function_parameters: Dict[str, Any],
                                            algorithm_parameters: Dict[str, Any],
                                            cross_validation_parameters: Dict[str, Any],
                                            stop_event: Event) -> Tuple[str, str, bool]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the Feature Selection experiment.
        @param experiment: FSExperiment instance.
        @param fit_fun_enum: Selected fitness function to compute.
        @param fitness_function_parameters: Parameters of the fitness function to compute.
        @param algorithm_parameters: Parameters of the FS algorithm (Blind Search, BBHA, PSO, etc) to compute.
        @param cross_validation_parameters: Parameters of the CrossValidation process.
        @param stop_event: Stop signal.
        @return Both molecules and clinical files paths.
        """
        # Get samples in common
        samples_in_common = get_common_samples(experiment)

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(
            experiment,
            samples_in_common
        )

        running_in_spark = self.__compute_fs_experiment(experiment, molecules_temp_file_path, clinical_temp_file_path,
                                                        fit_fun_enum, fitness_function_parameters,
                                                        cross_validation_parameters, algorithm_parameters, stop_event)

        return molecules_temp_file_path, clinical_temp_file_path, running_in_spark


    def eval_feature_selection_experiment(self, experiment: FSExperiment, fit_fun_enum: FitnessFunction,
                                          fitness_function_parameters: Dict[str, Any],
                                          algorithm_parameters: Dict[str, Any],
                                          cross_validation_parameters: Dict[str, Any], stop_event: Event):
        """
        Computes a Feature Selection experiment.
        @param experiment: FSExperiment to be processed.
        @param fit_fun_enum: Selected fitness function to compute.
        @param fitness_function_parameters: Parameters of the fitness function to compute.
        @param algorithm_parameters: Parameters of the FS algorithm (Blind Search, BBHA, PSO, etc) to compute.
        @param cross_validation_parameters: Parameters of the CrossValidation process.
        @param stop_event: Stop event to cancel the experiment
        """
        # Resulting Biomarker instance from the FS experiment.
        biomarker: Biomarker = experiment.created_biomarker

        # Computes the experiment
        molecules_temp_file_path: Optional[str] = None
        clinical_temp_file_path: Optional[str] = None
        try:
            logging.warning(f'ID FSExperiment -> {biomarker.pk}')
            # IMPORTANT: uses plain SQL as Django's autocommit management for transactions didn't work as expected
            # with exceptions thrown in subprocesses
            if self.use_transaction:
                with connection.cursor() as cursor:
                    cursor.execute("BEGIN")

            # Computes Feature Selection experiment
            start = time.time()
            molecules_temp_file_path, clinical_temp_file_path, running_in_spark = self.__prepare_and_compute_fs_experiment(
                experiment, fit_fun_enum, fitness_function_parameters, algorithm_parameters,
                cross_validation_parameters, stop_event
            )
            total_execution_time = time.time() - start
            logging.warning(f'FSExperiment {biomarker.pk} total time -> {total_execution_time} seconds')

            # If user cancel the experiment, discard changes
            if stop_event.is_set():
                raise ExperimentStopped
            else:
                self.__commit_or_rollback(is_commit=True, experiment=experiment)

                # Saves some data about the result of the experiment
                # If it's running in Spark, the execution time is not saved here because it's not known yet and
                # the state is set from the /aws-notification endpoint asynchronously
                if not running_in_spark:
                    experiment.execution_time = total_execution_time
                    biomarker.state = BiomarkerState.COMPLETED
        except NoSamplesInCommon:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('No samples in common')
            biomarker.state = BiomarkerState.NO_SAMPLES_IN_COMMON
        except ExperimentFailed:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error(f'FSExperiment {experiment.pk} has failed. Check logs for more info')
            biomarker.state = BiomarkerState.FINISHED_WITH_ERROR
        except ServerSelectionTimeoutError:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('MongoDB connection timeout!')
            biomarker.state = BiomarkerState.WAITING_FOR_QUEUE
        except NumberOfSamplesFewerThanCVFolds as ex:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error(f'ValueError raised due to number of member of each class being fewer than number '
                          f'of CV folds: {ex}')
            biomarker.state = BiomarkerState.NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS
        except ExperimentStopped:
            # If user cancel the experiment, discard changes
            logging.warning(f'FSExperiment {experiment.pk} was stopped')
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            biomarker.state = BiomarkerState.STOPPED
        except Exception as e:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.exception(e)
            logging.warning(f'Setting BiomarkerState.FINISHED_WITH_ERROR to biomarker {biomarker.pk}')
            biomarker.state = BiomarkerState.FINISHED_WITH_ERROR
        finally:
            # Removes the temporary files
            if molecules_temp_file_path is not None:
                os.unlink(molecules_temp_file_path)

            if clinical_temp_file_path is not None:
                os.unlink(clinical_temp_file_path)

        # Saves changes in DB
        biomarker.save()
        experiment.save()

        # Maybe the experiment didn't find any feature. NOTE: needs to be checked after saving the experiment
        if experiment.best_model.state == TrainedModelState.NO_FEATURES_FOUND:
            biomarker.state = BiomarkerState.NO_FEATURES_FOUND
            biomarker.save(update_fields=['state'])

        # Removes key
        self.__removes_experiment_future(experiment.pk)

        close_db_connection()

    @staticmethod
    def __create_target_biomarker(experiment: FSExperiment):
        """Creates a new Biomarker and assigns it to the FSExperiment instance."""
        origin_biomarker = experiment.origin_biomarker
        new_biomarker = Biomarker.objects.create(
            name=f'"{origin_biomarker.name}" (FS optimized {experiment.pk})',
            description=origin_biomarker.description,
            origin=BiomarkerOrigin.FEATURE_SELECTION,
            state=BiomarkerState.IN_PROCESS,
            user=origin_biomarker.user
        )
        experiment.created_biomarker = new_biomarker
        experiment.save()

    def add_experiment(self, experiment: FSExperiment, fit_fun_enum: FitnessFunction,
                       fitness_function_parameters: Dict[str, Any], cross_validation_parameters: Dict[str, Any],
                       algorithm_parameters: Dict[str, Any]):
        """
        Adds a Feature Selection experiment to the ThreadPool to be processed
        @param experiment: FSExperiment to be processed
        @param fit_fun_enum: Selected fitness function to compute.
        @param fitness_function_parameters: Parameters of the fitness function to compute.
        @param cross_validation_parameters: Parameters of the CrossValidation process.
        @param algorithm_parameters: Parameters of the FS algorithm (Blind Search, BBHA, PSO, etc) to compute.
        """
        experiment_event = Event()

        # Creates the resulting Biomarker
        self.__create_target_biomarker(experiment)

        # Submits
        experiment_future = self.executor.submit(self.eval_feature_selection_experiment, experiment, fit_fun_enum,
                                                 fitness_function_parameters, algorithm_parameters,
                                                 cross_validation_parameters, experiment_event)
        self.fs_experiments_futures[experiment.pk] = (experiment_future, experiment_event)

    def stop_experiment(self, experiment: FSExperiment):
        """
        Stops a specific experiment
        @param experiment: FSExperiment to stop
        """
        if experiment.pk in self.fs_experiments_futures:
            (experiment_future, experiment_event) = self.fs_experiments_futures[experiment.pk]
            if experiment_future.cancel():
                # If cancel() returns True it means that the experiment was waiting in queue and was
                # successfully canceled
                experiment.state = BiomarkerState.STOPPED
            else:
                # Sends signal to stop the experiment
                experiment.state = BiomarkerState.STOPPING
                experiment_event.set()
            experiment.save()

            # Removes key
            self.__removes_experiment_future(experiment.pk)

    def compute_pending_experiments(self):
        """
        Gets all the not computed experiments to add to the queue. Get IN_PROCESS too because
        if the TaskQueue is being created It couldn't be processing experiments. Some experiments
        could be in that state due to unexpected errors in server.
        TODO: call this in the apps.py
        """
        logging.warning('Checking pending Feature Selection experiments')
        # Gets the experiment by submit date (ASC)
        experiments: QuerySet = FSExperiment.objects.filter(
            Q(state=BiomarkerState.WAITING_FOR_QUEUE)
            | Q(state=BiomarkerState.IN_PROCESS)
        ).order_by('submit_date')
        logging.warning(f'{experiments.count()} pending experiments are being sent for processing')
        for experiment in experiments:
            # If the experiment has already reached a limit of attempts, it's marked as error
            if experiment.attempt == 3:
                logging.error(f'FSExperiment with PK: {experiment.pk} has reached attempts limit.')
                experiment.state = BiomarkerState.REACHED_ATTEMPTS_LIMIT
                experiment.save()
            elif not hasattr(experiment, 'best_model'):
                logging.error(f'FSExperiment with PK: {experiment.pk} has no trained model to recover.')
                experiment.state = BiomarkerState.FINISHED_WITH_ERROR
                experiment.save()
            else:
                experiment.attempt += 1  # TODO: add this field to the model
                experiment.save()
                logging.warning(f'Running experiment "{experiment}". Current attempt: {experiment.attempt}')
                trained_model: TrainedModel = experiment.trained_model
                fitness_function_enum = trained_model.fitness_function

                fitness_function_parameters = None
                if hasattr(trained_model, 'svm_parameters'):
                    svm_parameters: SVMParameters = trained_model.svm_parameters
                    fitness_function_parameters = {
                        'svmParameters': {
                            'kernel': svm_parameters.kernel,
                            'task': svm_parameters.task
                        }
                    }
                elif hasattr(trained_model, 'clustering_parameters'):
                    clustering_parameters: ClusteringParameters = trained_model.clustering_parameters
                    fitness_function_parameters = {
                        'clusteringParameters': {
                            'algorithm': clustering_parameters.algorithm,
                            'metric': clustering_parameters.metric,
                            'scoringMethod': clustering_parameters.scoring_method,
                        }
                    }
                else:
                    # TODO: implement the rest of types of parameters
                    logging.error(f'Invalid fitness function parameters for FSExperiment with PK: {experiment.pk}')

                if fitness_function_parameters is not None:
                    pass
                    # TODO: add fs_parameters and uncomment
                    # self.add_experiment(experiment, fitness_function_enum, fitness_function_parameters)
                else:
                    experiment.state = BiomarkerState.FINISHED_WITH_ERROR
                    experiment.save()

        close_db_connection()

    def __removes_experiment_future(self, experiment_pk: int):
        """
        Removes a specific key from self.experiments_futures
        @param experiment_pk: PK to remove
        """
        del self.fs_experiments_futures[experiment_pk]


global_fs_service = FSService()
