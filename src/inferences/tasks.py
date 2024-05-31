import logging
import os
import time
from typing import Optional
from billiard.exceptions import SoftTimeLimitExceeded
from celery.contrib.abortable import AbortableTask
from django.conf import settings
from pymongo.errors import ServerSelectionTimeoutError
from inferences.inference_service import prepare_and_compute_inference_experiment
from multiomics_intermediate.celery import app
from biomarkers.models import BiomarkerState
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed, EmptyDataset, NoValidMoleculesForModel
from inferences.models import InferenceExperiment


@app.task(bind=True, base=AbortableTask, acks_late=True, reject_on_worker_lost=True,
          soft_time_limit=settings.INFERENCE_SOFT_TIME_LIMIT)
def eval_inference_experiment(self, experiment_pk: int):
    """
    Computes an InferenceExperiment.
    @param self: Self instance of the Celery task (available due to bind=True).
    @param experiment_pk: InferenceExperiment's PK to be processed.
    """
    # Due to Celery getting old jobs from the queue, we need to check if the experiment still exists
    try:
        experiment: InferenceExperiment = InferenceExperiment.objects.get(pk=experiment_pk)
    except InferenceExperiment.DoesNotExist:
        logging.error(f'InferenceExperiment {experiment_pk} does not exist')
        return

    # Checks if the experiment has reached the limit of attempts
    if experiment.attempt >= 3:
        logging.warning(f'InferenceExperiment {experiment.pk} has reached attempts limit.')
        experiment.state = BiomarkerState.REACHED_ATTEMPTS_LIMIT
        experiment.save(update_fields=['state'])
        return

    # Increments the attempt and sets the state of the experiment to IN_PROCESS
    experiment.attempt += 1
    experiment.state = BiomarkerState.IN_PROCESS
    experiment.save(update_fields=['attempt', 'state'])

    # Computes the experiment
    molecules_temp_file_path: Optional[str] = None
    try:
        logging.warning(f'ID InferenceExperiment -> {experiment.pk}')

        # Computes Feature Selection experiment
        start = time.time()
        molecules_temp_file_path = prepare_and_compute_inference_experiment(experiment, self.is_aborted)
        total_execution_time = time.time() - start
        logging.warning(f'InferenceExperiment {experiment.pk} total time -> {total_execution_time} seconds')

        # If user cancel the experiment, discard changes
        if self.is_aborted():
            raise ExperimentStopped

        # Saves some data about the result of the experiment
        experiment.execution_time = total_execution_time
        experiment.state = BiomarkerState.COMPLETED
    except NoSamplesInCommon:
        logging.error('No samples in common')
        experiment.state = BiomarkerState.NO_SAMPLES_IN_COMMON
    except EmptyDataset:
        logging.error(f'InferenceExperiment {experiment.pk} has no valid samples/molecules')
        experiment.state = BiomarkerState.EMPTY_DATASET
    except NoValidMoleculesForModel as ex:
        logging.error(f'InferenceExperiment {experiment.pk} has no valid molecules: {ex}')
        experiment.state = BiomarkerState.NO_VALID_MOLECULES
    except ExperimentFailed:
        logging.error(f'InferenceExperiment {experiment.pk} has failed. Check logs for more info')
        experiment.state = BiomarkerState.FINISHED_WITH_ERROR
    except ServerSelectionTimeoutError:
        logging.error('MongoDB connection timeout!')
        experiment.state = BiomarkerState.WAITING_FOR_QUEUE
    except ExperimentStopped:
        # If user cancel the experiment, discard changes
        logging.warning(f'InferenceExperiment {experiment.pk} was stopped')
        experiment.state = BiomarkerState.STOPPED
    except SoftTimeLimitExceeded as e:
        # If celery soft time limit is exceeded, sets the experiment as TIMEOUT_EXCEEDED
        logging.warning(f'InferenceExperiment {experiment.pk} has exceeded the soft time limit')
        logging.exception(e)
        experiment.state = BiomarkerState.TIMEOUT_EXCEEDED
    except Exception as e:
        logging.exception(e)
        logging.warning(f'Setting BiomarkerState.FINISHED_WITH_ERROR to experiment {experiment.pk}')
        experiment.state = BiomarkerState.FINISHED_WITH_ERROR
    finally:
        # Removes the temporary files
        if molecules_temp_file_path is not None:
            os.unlink(molecules_temp_file_path)

    # Saves changes in DB
    experiment.save()