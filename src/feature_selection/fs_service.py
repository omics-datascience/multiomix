import os
import tempfile
import time
import numpy as np
from threading import Event
from typing import Dict, Tuple, cast, Optional, Union, List, Any
import pandas as pd
from biomarkers.models import BiomarkerState, Biomarker, BiomarkerOrigin, MRNAIdentifier, MiRNAIdentifier, \
    CNAIdentifier, MethylationIdentifier
from common.utils import get_samples_intersection
from user_files.models_choices import FileType
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed
from .fs_algorithms import blind_search_sequential, binary_black_hole_sequential, select_top_cox_regression
from .fs_algorithms_spark import binary_black_hole_spark
from .models import FSExperiment, FitnessFunction, FeatureSelectionAlgorithm, SVMParameters, TrainedModel, \
    ClusteringParameters
from concurrent.futures import ThreadPoolExecutor, Future
from pymongo.errors import ServerSelectionTimeoutError
import logging
from django.db.models import Q, QuerySet
from django.conf import settings
from django.db import connection
from common.functions import close_db_connection
from .utils import save_model_dump_and_best_score, create_models_parameters_and_classifier

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
    def __get_common_samples(experiment: FSExperiment) -> np.ndarray:
        """
        Gets a sorted Numpy array with the samples ID in common between both ExperimentSources.
        @param experiment: Feature Selection experiment.
        @return: Sorted Numpy array with the samples in common
        """
        # NOTE: the intersection is already sorted by Numpy
        last_intersection: Optional[np.ndarray] = None

        for source in experiment.get_all_sources():
            if source is None:
                continue

            last_intersection = get_samples_intersection(source, last_intersection)

        return cast(np.ndarray, last_intersection)

    @staticmethod
    def __replace_event_col_for_booleans(value: Union[int, str]) -> bool:
        """Replaces string or integer events in datasets to booleans values to make survival analysis later."""
        return value in [1, '1'] or any(candidate in value for candidate in COMMON_INTEREST_VALUES)


    def __generate_df_molecules_and_clinical(self, experiment: FSExperiment,
                                             samples_in_common: np.ndarray) -> Tuple[str, str]:
        """
        Generates two DataFrames: one with all the selected molecules, and other with the selected clinical data.
        @param experiment: FSExperiment instance to extract molecules and clinical data from its sources.
        @param samples_in_common: Samples in common to extract from the datasets.
        @return: Both DataFrames paths.
        """
        # Generates clinical DataFrame
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
            clinical_temp_file_path = temp_file.name

            clinical_source = experiment.clinical_source
            clinical_df: pd.DataFrame = clinical_source.get_df()

            # Keeps only the survival tuple and samples in common
            survival_tuple = clinical_source.get_survival_columns().first()  # TODO: implement the selection of the survival tuple from the frontend
            clinical_df = clinical_df[[survival_tuple.event_column, survival_tuple.time_column]]

            clinical_df = clinical_df.loc[samples_in_common]

            # Replaces str values of CGDS for
            clinical_df[survival_tuple.event_column] = clinical_df[survival_tuple.event_column].apply(
                self.__replace_event_col_for_booleans
            )

            # Saves in disk
            clinical_df.to_csv(temp_file, sep='\t', decimal='.')

        # Generates all the molecules DataFrame
        with tempfile.NamedTemporaryFile(mode='a', delete=False) as temp_file:
            molecules_temp_file_path = temp_file.name

            for source, molecules, file_type in experiment.get_sources_and_molecules():
                if source is None:
                    continue

                for chunk in source.get_df_in_chunks():
                    # Only keeps the samples in common
                    chunk = chunk[samples_in_common]

                    # Keeps only existing molecules in the current chunk
                    molecules_to_extract = np.intersect1d(chunk.index, molecules)
                    chunk = chunk.loc[molecules_to_extract]

                    # Adds type to disambiguate between genes of 'mRNA' type and 'CNA' type
                    chunk.index = chunk.index + f'_{file_type}'

                    # Saves in disk
                    chunk.to_csv(temp_file, header=temp_file.tell() == 0, sep='\t', decimal='.')

        return molecules_temp_file_path, clinical_temp_file_path

    @staticmethod
    def __save_molecule_identifiers(created_biomarker: Biomarker, best_features: List[str]):
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

    def __compute_experiment(self, experiment: FSExperiment, molecules_temp_file_path: str,
                             clinical_temp_file_path: str, fit_fun_enum: FitnessFunction,
                             model_parameters: Dict[str, Any],
                             stop_event: Event) -> bool:
        """
        Computes the Feature Selection experiment using the params defined by the user.
        TODO: use stop_event
        @param experiment: FSExperiment instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
        @param fit_fun_enum: Selected fitness function to compute.
        @param model_parameters: Parameters of the fitness function to compute.
        @param stop_event: Stop signal.
        @return A flag to indicate whether the experiment is running in spark
        """
        # Creates TrainedModel instance
        trained_model: TrainedModel = TrainedModel.objects.create(
            name=f'From FS for biomarker {experiment.created_biomarker.name}',
            biomarker=experiment.created_biomarker,
            fitness_function=fit_fun_enum,
            state=BiomarkerState.IN_PROCESS,
            fs_experiment=experiment
        )

        # Gets model instance and stores its parameters
        classifier, clustering_scoring_method, is_clustering, is_regression = create_models_parameters_and_classifier(
            trained_model, model_parameters)

        # Gets molecules and clinical DataFrames
        molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)
        clinical_df = pd.read_csv(clinical_temp_file_path, sep='\t', decimal='.', index_col=0)

        # In case of regression removes time == 0 in the datasets to prevent errors in the models fit() method
        if is_regression:
            time_column = clinical_df.columns.tolist()[1]  # The time column is ALWAYS the second one at this point
            clinical_df = clinical_df[clinical_df[time_column] > 0]

        # Keeps only the samples in common
        valid_samples = clinical_df.index
        molecules_df = molecules_df[valid_samples]  # Samples are as columns in molecules_df

        # Formats clinical data to a Numpy structured array
        clinical_data = np.core.records.fromarrays(clinical_df.to_numpy().transpose(), names='event, time',
                                                   formats='bool, float')

        # Gets FS algorithm
        if experiment.algorithm == FeatureSelectionAlgorithm.BLIND_SEARCH:
            best_features, best_model, best_score = blind_search_sequential(classifier, molecules_df, clinical_data,
                                                                            is_clustering, clustering_scoring_method)
        elif experiment.algorithm == FeatureSelectionAlgorithm.BBHA:
            # TODO: add here a min_number_of_features parameter to prevent sending a little experiment to AWS
            if settings.ENABLE_AWS_EMR_INTEGRATION:
                job_id = binary_black_hole_spark(
                    job_name=f'Job for FSExperiment: {experiment.pk}',
                    classifier=classifier,
                    molecules_df=molecules_df,
                    n_stars=25,  # TODO: parametrize in frontend
                    n_iterations=10,  # TODO: parametrize in frontend
                    clinical_df=clinical_df,
                    is_clustering=is_clustering,
                    clustering_score_method=clustering_scoring_method,
                    binary_threshold=None  # TODO: parametrize in frontend
                )

                # Saves the job id in the experiment
                experiment.emr_job_id = job_id
                experiment.save(update_fields=['emr_job_id'])

                # It doesn't need to wait anything because the job is running in the AWS cluster right now
                return True  # Indicates that the experiment is running in AWS
            else:
                # Runs sequential version
                best_features, best_model, best_score = binary_black_hole_sequential(
                    classifier,
                    molecules_df,
                    n_stars=25,  # TODO: parametrize in frontend
                    n_iterations=10,  # TODO: parametrize in frontend
                    clinical_data=clinical_data,
                    is_clustering=is_clustering,
                    clustering_score_method=clustering_scoring_method
                )
        elif experiment.algorithm == FeatureSelectionAlgorithm.COX_REGRESSION:
            best_features, best_model, best_score = select_top_cox_regression(
                molecules_df,
                clinical_data,
                filter_zero_coeff=True, # Keeps only != 0 coefficient
                top_n=None  # TODO: parametrize from frontend
            )
        else:
            # TODO: implement PSO and GA
            raise Exception('Algorithm not implemented')

        if best_features is not None:
            # Stores molecules in the target biomarker, the best model and its fitness value
            self.__save_molecule_identifiers(experiment.created_biomarker, best_features)

            trained_model.state = BiomarkerState.COMPLETED

            # Stores the trained model and best score
            if best_model is not None and best_score is not None:
                save_model_dump_and_best_score(trained_model, best_model, best_score)
        else:
            trained_model.state = BiomarkerState.NO_FEATURES_FOUND

        trained_model.save(update_fields=['state'])

        return False  # It is not running in spark

    def __prepare_and_compute_experiment(self, experiment: FSExperiment, fit_fun_enum: FitnessFunction,
                                         fitness_function_parameters: Dict[str, Any],
                                         stop_event: Event) -> Tuple[str, str, bool]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the Feature Selection experiment.
        @param experiment: FSExperiment instance.
        @param fit_fun_enum: Selected fitness function to compute.
        @param fitness_function_parameters: Parameters of the fitness function to compute.
        @param stop_event: Stop signal.
        @return Both molecules and clinical files paths.
        """
        # Get samples in common
        samples_in_common = self.__get_common_samples(experiment)
        if samples_in_common.size == 0:
            raise NoSamplesInCommon

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(
            experiment,
            samples_in_common
        )

        running_in_spark = self.__compute_experiment(experiment, molecules_temp_file_path, clinical_temp_file_path,
                                                     fit_fun_enum, fitness_function_parameters, stop_event)

        return molecules_temp_file_path, clinical_temp_file_path, running_in_spark


    def eval_feature_selection_experiment(self, experiment: FSExperiment, fit_fun_enum: FitnessFunction,
                                          fitness_function_parameters: Dict[str, Any],
                                          stop_event: Event):
        """
        Computes a Feature Selection experiment.
        @param experiment: FSExperiment to be processed.
        @param fit_fun_enum: Selected fitness function to compute.
        @param fitness_function_parameters: Parameters of the fitness function to compute.
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
            molecules_temp_file_path, clinical_temp_file_path, running_in_spark = self.__prepare_and_compute_experiment(
                experiment, fit_fun_enum, fitness_function_parameters, stop_event
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
                       fitness_function_parameters: Dict[str, Any]):
        """
        Adds a Feature Selection experiment to the ThreadPool to be processed
        @param experiment: FSExperiment to be processed
        @param fit_fun_enum: Selected fitness function to compute.
        @param fitness_function_parameters: Parameters of the fitness function to compute.
        """
        experiment_event = Event()

        # Creates the resulting Biomarker
        self.__create_target_biomarker(experiment)

        # Submits
        experiment_future = self.executor.submit(self.eval_feature_selection_experiment, experiment, fit_fun_enum,
                                                 fitness_function_parameters, experiment_event)
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
                    self.add_experiment(experiment, fitness_function_enum, fitness_function_parameters)
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