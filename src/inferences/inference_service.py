import os
import tempfile
import time
import numpy as np
from threading import Event
from typing import Dict, Tuple, cast, Optional, List
import pandas as pd
from biomarkers.models import BiomarkerState
from common.constants import TCGA_CONVENTION
from common.utils import get_subset_of_features
from feature_selection.fs_algorithms import SurvModel
from feature_selection.models import TrainedModel
from inferences.models import InferenceExperiment, SampleAndClusterPrediction
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed
from concurrent.futures import ThreadPoolExecutor, Future
from pymongo.errors import ServerSelectionTimeoutError
import logging
from django.db.models import Q, QuerySet
from django.conf import settings
from django.db import connection
from common.functions import close_db_connection
from user_files.models_choices import FileType


class InferenceExperimentsService(object):
    """
    Process InferenceExperiments in a Thread Pool as explained
    at https://docs.python.org/3.8/library/concurrent.futures.html
    """
    executor: ThreadPoolExecutor = None
    use_transaction: bool
    inference_experiments_futures: Dict[int, Tuple[Future, Event]] = {}

    def __init__(self):
        # Instantiates the executor
        # IMPORTANT: ProcessPoolExecutor doesn't work well with Channels. It wasn't sending
        # websockets messages by some weird reason that I couldn't figure out. Let's use Threads instead of
        # processes
        self.executor = ThreadPoolExecutor(max_workers=settings.THREAD_POOL_SIZE)
        self.use_transaction = settings.USE_TRANSACTION_IN_EXPERIMENT
        self.inference_experiments_futures = {}

    def __commit_or_rollback(self, is_commit: bool, experiment: InferenceExperiment):
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
    def __get_common_samples(experiment: InferenceExperiment) -> np.ndarray:
        """
        Gets a sorted Numpy array with the samples ID in common between both ExperimentSources.
        TODO: refactor to a common function
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
                cur_intersection = np.array(source.get_samples())
            last_intersection = cast(np.ndarray, cur_intersection)

        return cast(np.ndarray, last_intersection)

    @staticmethod
    def __process_chunk(chunk: pd.DataFrame, file_type: FileType, molecules: List[str],
                        samples_in_common: np.ndarray) -> pd.DataFrame:
        """Processes a chunk of a DataFrame adding the file type to the index and keeping just the samples in common."""
        # Only keeps the samples in common
        chunk = chunk[samples_in_common]

        # Keeps only existing molecules in the current chunk
        molecules_to_extract = np.intersect1d(chunk.index, molecules)
        chunk = chunk.loc[molecules_to_extract]

        # Adds type to disambiguate between genes of 'mRNA' type and 'CNA' type
        chunk.index = chunk.index + f'_{file_type}'

        # Removes TCGA suffix
        chunk.columns = chunk.columns.str.replace(TCGA_CONVENTION, '', regex=True)

        return chunk

    def __generate_molecules_file(self, stat_validation: InferenceExperiment, samples_in_common: np.ndarray) -> str:
        """
        Generates the molecules DataFrame for a specific InferenceExperiment with the samples in common and saves
        it in disk.
        """
        with tempfile.NamedTemporaryFile(mode='a', delete=False) as temp_file:
            molecules_temp_file_path = temp_file.name

            for source, molecules, file_type in stat_validation.get_sources_and_molecules():
                if source is None:
                    continue

                for chunk in source.get_df_in_chunks():
                    chunk = self.__process_chunk(chunk, file_type, molecules, samples_in_common)

                    # Saves in disk
                    chunk.to_csv(temp_file, header=temp_file.tell() == 0, sep='\t', decimal='.')

        return molecules_temp_file_path

    def __compute_inference_experiment(self, experiment: InferenceExperiment, molecules_temp_file_path: str,
                                       stop_event: Event):
        """
        Computes the Feature Selection experiment using the params defined by the user.
        TODO: use stop_event
        @param experiment: InferenceExperiment instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param stop_event: Stop signal.
        """
        trained_model: TrainedModel = experiment.trained_model
        classifier: SurvModel = trained_model.get_model_instance()
        is_clustering = hasattr(trained_model, 'clustering_parameters')
        is_regression = not is_clustering  # If it's not a clustering model, it's an SVM or RF

        if is_regression:
            # TODO: implement regression
            raise Exception("Regression is not implemented yet")

        # TODO: refactor this retrieval of data as it's repeated in the fs_service
        # Gets molecules and clinica DataFrames
        molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)

        # Computes general metrics
        # Gets all the molecules in the needed order. It's necessary to call get_subset_of_features to fix the
        # structure of data
        molecules_df = get_subset_of_features(molecules_df, molecules_df.index)

        # Gets a list of samples
        samples = np.array(molecules_df.index.tolist())

        if is_clustering:
            # Gets the groups
            clustering_result = classifier.predict(molecules_df.values)

            # Retrieves the data for every group and stores the survival function
            for cluster_id in range(classifier.n_clusters):
                # Gets the samples in the current cluster
                current_samples = samples[np.where(clustering_result == cluster_id)]

                # Stores the prediction and the samples
                SampleAndClusterPrediction.objects.bulk_create([
                    SampleAndClusterPrediction(
                        sample=sample_id,
                        cluster=cluster_id,
                        experiment=experiment
                    )
                    for sample_id in current_samples
                ])

        experiment.save()

    def __prepare_and_compute_experiment(self, experiment: InferenceExperiment, stop_event: Event) -> str:
        """
        Gets samples in common, generates needed DataFrames and finally computes the Feature Selection experiment.
        @param experiment: InferenceExperiment instance.
        @param stop_event: Stop signal.
        @return Trained model instance if everything was ok. None if no best features were found.
        """
        # Get samples in common
        samples_in_common = self.__get_common_samples(experiment)
        if samples_in_common.size == 0:
            raise NoSamplesInCommon

        # Generates needed DataFrames
        molecules_temp_file_path = self.__generate_molecules_file(experiment, samples_in_common)

        self.__compute_inference_experiment(experiment, molecules_temp_file_path, stop_event)

        return molecules_temp_file_path


    def eval_inference_experiment(self, experiment: InferenceExperiment, stop_event: Event):
        """
        Computes a Feature Selection experiment.
        @param experiment: InferenceExperiment to be processed.
        @param stop_event: Stop event to cancel the experiment
        """
        # Resulting Biomarker instance from the FS experiment.

        # Computes the experiment
        molecules_temp_file_path: Optional[str] = None
        try:
            logging.warning(f'ID InferenceExperiment -> {experiment.pk}')
            # IMPORTANT: uses plain SQL as Django's autocommit management for transactions didn't work as expected
            # with exceptions thrown in subprocesses
            if self.use_transaction:
                with connection.cursor() as cursor:
                    cursor.execute("BEGIN")

            # Computes Feature Selection experiment
            start = time.time()
            molecules_temp_file_path = self.__prepare_and_compute_experiment(experiment, stop_event)
            total_execution_time = time.time() - start
            logging.warning(f'InferenceExperiment {experiment.pk} total time -> {total_execution_time} seconds')

            # If user cancel the experiment, discard changes
            if stop_event.is_set():
                raise ExperimentStopped
            else:
                self.__commit_or_rollback(is_commit=True, experiment=experiment)

                # Saves some data about the result of the experiment
                experiment.execution_time = total_execution_time
                experiment.state = BiomarkerState.COMPLETED
        except NoSamplesInCommon:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('No samples in common')
            experiment.state = BiomarkerState.NO_SAMPLES_IN_COMMON
        except ExperimentFailed:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error(f'InferenceExperiment {experiment.pk} has failed. Check logs for more info')
            experiment.state = BiomarkerState.FINISHED_WITH_ERROR
        except ServerSelectionTimeoutError:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('MongoDB connection timeout!')
            experiment.state = BiomarkerState.WAITING_FOR_QUEUE
        except ExperimentStopped:
            # If user cancel the experiment, discard changes
            logging.warning(f'InferenceExperiment {experiment.pk} was stopped')
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            experiment.state = BiomarkerState.STOPPED
        except Exception as e:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.exception(e)
            logging.warning(f'Setting BiomarkerState.FINISHED_WITH_ERROR to experiment {experiment.pk}')
            experiment.state = BiomarkerState.FINISHED_WITH_ERROR
        finally:
            # Removes the temporary files
            if molecules_temp_file_path is not None:
                os.unlink(molecules_temp_file_path)

        # Saves changes in DB
        experiment.save()

        # Removes key
        self.__removes_experiment_future(experiment.pk)

        close_db_connection()

    def add_inference_experiment(self, experiment: InferenceExperiment):
        """
        Adds a Feature Selection experiment to the ThreadPool to be processed
        @param experiment: InferenceExperiment to be processed
        """
        experiment_event = Event()

        # Submits
        experiment_future = self.executor.submit(self.eval_inference_experiment, experiment, experiment_event)
        self.inference_experiments_futures[experiment.pk] = (experiment_future, experiment_event)

    def stop_experiment(self, experiment: InferenceExperiment):
        """
        Stops a specific experiment
        @param experiment: InferenceExperiment to stop
        """
        if experiment.pk in self.inference_experiments_futures:
            (experiment_future, experiment_event) = self.inference_experiments_futures[experiment.pk]
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
        logging.warning('Checking pending InferenceExperiments')
        # Gets the experiment by submit date (ASC)
        experiments: QuerySet = InferenceExperiment.objects.filter(
            Q(state=BiomarkerState.WAITING_FOR_QUEUE)
            | Q(state=BiomarkerState.IN_PROCESS)
        ).order_by('submit_date')
        logging.warning(f'{experiments.count()} pending experiments are being sent for processing')
        for experiment in experiments:
            # If the experiment has already reached a limit of attempts, it's marked as error
            if experiment.attempt == 3:
                logging.error(f'InferenceExperiment with PK: {experiment.pk} has reached attempts limit.')
                experiment.state = BiomarkerState.REACHED_ATTEMPTS_LIMIT
                experiment.save()
            else:
                experiment.attempt += 1  # TODO: add this field to the model
                experiment.save()
                logging.warning(f'Running experiment "{experiment}". Current attempt: {experiment.attempt}')
                self.add_inference_experiment(experiment)

        close_db_connection()

    def __removes_experiment_future(self, experiment_pk: int):
        """
        Removes a specific key from self.experiments_futures
        @param experiment_pk: PK to remove
        """
        del self.inference_experiments_futures[experiment_pk]


global_inference_service = InferenceExperimentsService()
