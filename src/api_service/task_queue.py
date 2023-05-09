import time
from threading import Event
from typing import Dict, Tuple
from .models import Experiment
from .models_choices import ExperimentState
from concurrent.futures import ThreadPoolExecutor, Future
from .pipelines import global_pipeline_manager
from .exceptions import ExperimentFailed, NoSamplesInCommon, ExperimentStopped
from pymongo.errors import ServerSelectionTimeoutError
import logging
from django.db.models import Q, QuerySet
from django.conf import settings
from django.db import connection
from common.functions import close_db_connection


class TaskQueue(object):
    """
    Process correlation analysis in a Thread Pool
    as explained at https://docs.python.org/3.8/library/concurrent.futures.html
    """
    executor: ThreadPoolExecutor = None
    use_transaction: bool
    experiments_futures: Dict[int, Tuple[Future, Event]] = {}

    def __init__(self):
        # Instantiates the executor
        # IMPORTANT: ProcessPoolExecutor doesn't work well with Channels. It wasn't sending
        # websockets messages by some weird reason that I couldn't figure out. Let's use Threads instead of
        # processes
        self.executor = ThreadPoolExecutor(max_workers=settings.THREAD_POOL_SIZE)
        self.use_transaction = settings.USE_TRANSACTION_IN_EXPERIMENT
        self.experiments_futures = {}

    def __commit_or_rollback(self, is_commit: bool, experiment: Experiment):
        """
        Executes a COMMIT or ROLLBACK sentence in DB. IMPORTANT: uses plain SQL as Django's autocommit
        management for transactions didn't work as expected with exceptions thrown in subprocesses.
        @param is_commit: If True, COMMIT is executed. ROLLBACK otherwise.
        """
        if self.use_transaction:
            query = "COMMIT" if is_commit else "ROLLBACK"
            with connection.cursor() as cursor:
                cursor.execute(query)
        elif not is_commit:
            # Simulates a rollback removing all associated combinations
            logging.warning(f'Rolling back {experiment.pk} manually')
            start = time.time()
            experiment.combinations.delete()
            logging.warning(f'Manual rollback of experiment {experiment.pk} -> {time.time() - start} seconds')

    def eval_mrna_gem_experiment(self, experiment: Experiment, stop_event: Event) -> None:
        """
        Computes a mRNA x miRNA/CNA/Methylation experiment.
        @param experiment: Experiment to be processed.
        @param stop_event: Stop event to cancel the experiment.
        """
        experiment.state = ExperimentState.IN_PROCESS
        experiment.save()

        # Computes the experiment
        try:
            logging.warning(f'ID EXPERIMENT -> {experiment.pk}')
            # IMPORTANT: uses plain SQL as Django's autocommit management for transactions didn't work as expected
            # with exceptions thrown in subprocesses
            if self.use_transaction:
                with connection.cursor() as cursor:
                    cursor.execute("BEGIN")

            # Computes correlation analysis
            start = time.time()
            total_row_count, final_row_count, evaluated_combinations = global_pipeline_manager.compute_experiment(
                experiment,
                stop_event
            )
            logging.warning(f'Experiment {experiment.pk} total time -> {time.time() - start} seconds')

            # If user cancel the experiment, discard changes
            if stop_event.is_set():
                raise ExperimentStopped
            else:
                self.__commit_or_rollback(is_commit=True, experiment=experiment)

                # Saves some data about the result of the experiment
                experiment.evaluated_row_count = evaluated_combinations
                experiment.result_total_row_count = total_row_count
                experiment.result_final_row_count = final_row_count
                experiment.state = ExperimentState.COMPLETED
        except NoSamplesInCommon:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('No samples in common')
            experiment.state = ExperimentState.NO_SAMPLES_IN_COMMON
        except ExperimentFailed:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error(f'Experiment {experiment.pk} has failed. Check logs for more info')
            experiment.state = ExperimentState.FINISHED_WITH_ERROR
        except ServerSelectionTimeoutError:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.error('MongoDB connection timeout!')
            experiment.state = ExperimentState.WAITING_FOR_QUEUE
        except ExperimentStopped:
            # If user cancel the experiment, discard changes
            logging.warning(f'Experiment {experiment.pk} was stopped')
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            experiment.state = ExperimentState.STOPPED
        except Exception as e:
            self.__commit_or_rollback(is_commit=False, experiment=experiment)
            logging.exception(e)
            logging.warning(f'Setting ExperimentState.FINISHED_WITH_ERROR to {experiment.pk}')
            experiment.state = ExperimentState.FINISHED_WITH_ERROR

        # Saves changes in DB
        experiment.save()

        # Removes key
        self.__removes_experiment_future(experiment.pk)

        close_db_connection()

    def add_experiment(self, experiment: Experiment):
        """
        Adds an experiment to the ThreadPool to be processed
        @param experiment: Experiment to be processed
        """
        experiment_event = Event()
        experiment_future = self.executor.submit(self.eval_mrna_gem_experiment, experiment, experiment_event)
        self.experiments_futures[experiment.pk] = (experiment_future, experiment_event)

    def stop_experiment(self, experiment: Experiment):
        """
        Stops a specific experiment
        @param experiment: Experiment to stop
        """
        if experiment.pk in self.experiments_futures:
            (experiment_future, experiment_event) = self.experiments_futures[experiment.pk]
            if experiment_future.cancel():
                # If cancel() returns True it means that the experiment was waiting in queue and was
                # successfully canceled
                experiment.state = ExperimentState.STOPPED
            else:
                # Sends signal to stop the experiment
                experiment.state = ExperimentState.STOPPING
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
        experiments: QuerySet = Experiment.objects.filter(
            Q(state=ExperimentState.WAITING_FOR_QUEUE)
            | Q(state=ExperimentState.IN_PROCESS)
        ).order_by('submit_date')
        logging.warning(f'{experiments.count()} pending experiments are being sent for processing')
        for experiment in experiments:
            # If the experiment has already reached a limit of attempts, it's marked as error
            if experiment.attempt == 3:
                experiment.state = ExperimentState.REACHED_ATTEMPTS_LIMIT
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
        del self.experiments_futures[experiment_pk]


global_task_queue = TaskQueue()
