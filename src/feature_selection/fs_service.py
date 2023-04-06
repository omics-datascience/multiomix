import os
import tempfile
import time
import numpy as np
from threading import Event
from typing import Dict, Tuple, cast, Optional, Union
import pandas as pd
from biomarkers.models import BiomarkerState, Biomarker, BiomarkerOrigin
from .exceptions import FSExperimentStopped, NoSamplesInCommon, FSExperimentFailed
from .fs_algorithms import blind_search, compute_cross_validation_sequential
from .fs_models import get_rf_model, get_survival_svm_model
from .models import FSExperiment, FitnessFunction, FeatureSelectionAlgorithm
from concurrent.futures import ThreadPoolExecutor, Future
from pymongo.errors import ServerSelectionTimeoutError
import logging
from django.db.models import Q, QuerySet
from django.conf import settings
from django.db import connection
from common.functions import close_db_connection

# Common event values
COMMON_INTEREST_VALUES = ['DEAD', 'DECEASE', 'DEATH']


class FSService(object):
    """
    Process Feature Selection experiments in a Thread Pool as explained
    at https://docs.python.org/3.7/library/concurrent.futures.html
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
        Executes a COMMIT or ROLLBACK sentence in DB
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

            if last_intersection is not None:
                cur_intersection = np.intersect1d(
                    last_intersection,
                    source.get_samples()
                )
            else:
                cur_intersection = source.get_samples()
            last_intersection = cast(np.ndarray, cur_intersection)

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
                    # Keeps only the selected molecules for the samples in common
                    chunk = chunk[samples_in_common]

                    # Keeps only existing molecules in the current chunk
                    molecules_to_extract = np.intersect1d(chunk.index, molecules)
                    chunk = chunk.loc[molecules_to_extract]

                    # Saves in disk
                    chunk.to_csv(temp_file, header=temp_file.tell() == 0, sep='\t', decimal='.')

        return molecules_temp_file_path, clinical_temp_file_path

    @staticmethod
    def __compute_experiment(experiment: FSExperiment, molecules_temp_file_path: str, clinical_temp_file_path: str,
                             stop_event: Event):
        """
        Computes the Feature Selection experiment using the params defined by the user.
        TODO: use stop_event
        @param experiment: FSExperiment instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
        @param stop_event: Stop signal.
        """
        # Gets molecules and clinica DataFrames
        molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)
        clinical_df = pd.read_csv(clinical_temp_file_path, sep='\t', decimal='.', index_col=0)

        print(clinical_df.head())

        # Formats clinical data to a Numpy structured array
        clinical_data = np.core.records.fromarrays(clinical_df.to_numpy().transpose(), names='event, time',
                                                   formats='bool, float')

        # Gets model and fitness function
        if experiment.fitness_function == FitnessFunction.SVM:
            classifier = get_survival_svm_model(is_svm_regression=False, svm_kernel='linear', svm_optimizer='avltree')  # TODO: parametrize from frontend
        elif experiment.fitness_function == FitnessFunction.RF:
            classifier = get_rf_model()
        else:
            # TODO: implement
            raise Exception('Fitness function not implemented')

        # Gets FS algorithm
        if experiment.algorithm == FeatureSelectionAlgorithm.BLIND_SEARCH:
            best_features, best_score = blind_search(classifier, molecules_df, clinical_data)
            print(best_features)
            print(best_score)
        else:
            # TODO: implement
            raise Exception('Algorithm not implemented')



    def __prepare_and_compute_experiment(self, experiment: FSExperiment, stop_event: Event) -> Tuple[str, str]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the Feature Selection experiment.
        TODO: use stop_event
        @param experiment: FSExperiment instance.
        @param stop_event: Stop signal
        """
        # Get samples in common
        samples_in_common = self.__get_common_samples(experiment)
        if samples_in_common.size == 0:
            raise NoSamplesInCommon

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(experiment,
                                                                                                      samples_in_common)

        self.__compute_experiment(experiment, molecules_temp_file_path, clinical_temp_file_path, stop_event)

        return molecules_temp_file_path, clinical_temp_file_path


    def eval_feature_selection_experiment(self, experiment: FSExperiment, stop_event: Event) -> None:
        """
        Computes a Feature Selection experiment.
        @param experiment: FSExperiment to be processed.
        @param stop_event: Stop event to cancel the experiment
        """
        # Resulting Biomarker instance from the FS experiment.
        biomarker: Biomarker = experiment.created_biomarker

        # Computes the experiment
        molecules_temp_file_path: Optional[str] = None
        clinical_temp_file_path: Optional[str] = None
        try:
            logging.warning(f'ID FS EXPERIMENT -> {biomarker.pk}')
            # IMPORTANT: uses plain SQL as Django's autocommit management for transactions didn't work as expected
            # with exceptions thrown in subprocesses
            if self.use_transaction:
                with connection.cursor() as cursor:
                    cursor.execute("BEGIN")

            # Computes Feature Selection experiment
            start = time.time()
            molecules_temp_file_path, clinical_temp_file_path = self.__prepare_and_compute_experiment(experiment,
                                                                                                      stop_event)
            total_execution_time = time.time() - start
            logging.warning(f'FSExperiment {biomarker.pk} total time -> {total_execution_time} seconds')

            # If user cancel the experiment, discard changes
            if stop_event.is_set():
                raise FSExperimentStopped
            else:
                self.__commit_or_rollback(is_commit=True, experiment=experiment)

                # Saves some data about the result of the experiment
                # TODO: add better fitness value (add field in model too)
                experiment.execution_time = total_execution_time
                biomarker.state = BiomarkerState.COMPLETED
        except NoSamplesInCommon:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('No samples in common')
            biomarker.state = BiomarkerState.NO_SAMPLES_IN_COMMON
        except FSExperimentFailed:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error(f'FSExperiment {experiment.pk} has failed. Check logs for more info')
            biomarker.state = BiomarkerState.FINISHED_WITH_ERROR
        except ServerSelectionTimeoutError:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('MongoDB connection timeout!')
            biomarker.state = BiomarkerState.WAITING_FOR_QUEUE
        except FSExperimentStopped:
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
        self.__removes_experiment_future(biomarker.pk)

        close_db_connection()

    @staticmethod
    def __create_target_biomarker(experiment: FSExperiment):
        """Creates a new Biomarker and assigns it to the FSExperiment instance."""
        origin_biomarker = experiment.origin_biomarker
        new_biomarker = Biomarker.objects.create(
            name=f'{origin_biomarker.name} (FS optimized {time.time()})',
            description=origin_biomarker.description,
            origin=BiomarkerOrigin.FEATURE_SELECTION,
            state=BiomarkerState.IN_PROCESS,
            user=origin_biomarker.user
        )
        experiment.created_biomarker = new_biomarker
        experiment.save()

    def add_experiment(self, experiment: FSExperiment):
        """
        Adds a Feature Selection experiment to the ThreadPool to be processed
        @param experiment: FSExperiment to be processed
        """
        experiment_event = Event()

        # Creates the resulting Biomarker
        self.__create_target_biomarker(experiment)

        # Submits
        experiment_future = self.executor.submit(self.eval_feature_selection_experiment, experiment, experiment_event)
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
        could be in that state due to unexpected errors in server
        """
        logging.warning('Checking pending experiments')
        # Gets the experiment by submit date (ASC)
        experiments: QuerySet = FSExperiment.objects.filter(
            Q(state=BiomarkerState.WAITING_FOR_QUEUE)
            | Q(state=BiomarkerState.IN_PROCESS)
        ).order_by('submit_date')
        logging.warning(f'{experiments.count()} pending experiments are being sent for processing')
        for experiment in experiments:
            # If the experiment has already reached a limit of attempts, it's marked as error
            if experiment.attempt == 3:
                experiment.state = BiomarkerState.REACHED_ATTEMPTS_LIMIT
                experiment.save()
            else:
                experiment.attempt += 1
                experiment.save()
                logging.warning(f'Running experiment "{experiment}". Current attempt: {experiment.attempt}')
                self.add_experiment(experiment)

        close_db_connection()

    def __removes_experiment_future(self, experiment_pk: int):
        """
        Removes a specific key from self.experiments_futures
        @param experiment_pk: PK to remove
        """
        del self.fs_experiments_futures[experiment_pk]


global_fs_service = FSService()
