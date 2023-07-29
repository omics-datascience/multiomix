import logging
import time
from celery.contrib.abortable import AbortableTask
from django.conf import settings
from pymongo.errors import ServerSelectionTimeoutError
from api_service.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed
from api_service.models import Experiment
from api_service.models_choices import ExperimentState
import api_service.pipelines as pipelines
from multiomics_intermediate.celery import app
from celery.exceptions import SoftTimeLimitExceeded


@app.task(bind=True, base=AbortableTask, task_acks_late=True, soft_time_limit=settings.COR_ANALYSIS_SOFT_TIME_LIMIT)
def eval_mrna_gem_experiment(self, experiment_pk: int) -> None:
    """
    Computes a mRNA x miRNA/CNA/Methylation experiment.
    @param experiment_pk: Experiment pk to be processed.
    """
    experiment: Experiment = Experiment.objects.get(pk=experiment_pk)
    experiment.state = ExperimentState.IN_PROCESS
    experiment.save()

    # Computes the experiment
    try:
        logging.warning(f'ID EXPERIMENT -> {experiment.pk}')

        # Computes correlation analysis
        start = time.time()
        total_row_count, final_row_count, evaluated_combinations = pipelines.__compute_correlation_experiment(
            experiment,
            self.is_aborted
        )
        execution_time = time.time() - start

        # Saves some data about the result of the experiment
        experiment.execution_time = round(execution_time, 4)
        experiment.evaluated_row_count = evaluated_combinations
        experiment.result_total_row_count = total_row_count
        experiment.result_final_row_count = final_row_count
        experiment.state = ExperimentState.COMPLETED
    except NoSamplesInCommon:
        logging.error('No samples in common')
        experiment.state = ExperimentState.NO_SAMPLES_IN_COMMON
    except ExperimentFailed:
        logging.error(f'Experiment {experiment.pk} has failed. Check logs for more info')
        experiment.state = ExperimentState.FINISHED_WITH_ERROR
    except ServerSelectionTimeoutError as ex:
        logging.error(f'MongoDB connection timeout: {ex}')
        experiment.state = ExperimentState.FINISHED_WITH_ERROR
    except ExperimentStopped:
        # If user cancel the experiment, discard changes
        logging.warning(f'Experiment {experiment.pk} was stopped')
        experiment.state = ExperimentState.STOPPED
    except SoftTimeLimitExceeded as e:
        # If celery soft time limit is exceeded, sets the experiment as TIMEOUT_EXCEEDED
        logging.warning(f'Experiment {experiment.pk} has exceeded the soft time limit')
        logging.exception(e)
        experiment.state = ExperimentState.TIMEOUT_EXCEEDED
    except Exception as e:
        logging.exception(e)
        logging.warning(f'Setting ExperimentState.FINISHED_WITH_ERROR to {experiment.pk}')
        experiment.state = ExperimentState.FINISHED_WITH_ERROR

    # Saves changes in DB
    experiment.save()
