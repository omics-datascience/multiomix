import logging
import os
import time
from typing import Optional
from billiard.exceptions import SoftTimeLimitExceeded
from celery.contrib.abortable import AbortableTask
from django.conf import settings
from pymongo.errors import ServerSelectionTimeoutError
from biomarkers.models import Biomarker, BiomarkerState
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed
from multiomics_intermediate.celery import app
from statistical_properties.models import StatisticalValidation
from statistical_properties.stats_service import prepare_and_compute_stat_validation


@app.task(bind=True, base=AbortableTask, acks_late=True, reject_on_worker_lost=True,
          soft_time_limit=settings.STAT_VALIDATION_SOFT_TIME_LIMIT)
def eval_statistical_validation(self, stat_validation_pk: int) -> None:
    """
    Computes a statistical validation.
    @param self: Self instance of the Celery task (available due to bind=True).
    @param stat_validation_pk: StatisticalValidation's PK to be processed.
    """
    # Due to Celery getting old jobs from the queue, we need to check if the experiment still exists
    try:
        stat_validation: StatisticalValidation = StatisticalValidation.objects.get(pk=stat_validation_pk)
    except StatisticalValidation.DoesNotExist:
        logging.error(f'StatisticalValidation {stat_validation_pk} does not exist')
        return

    # Sets the state as IN_PROCESS
    stat_validation.state = BiomarkerState.IN_PROCESS
    stat_validation.save(update_fields=['state'])

    # TODO: add here check by attempts

    # Resulting Biomarker instance from the FS stat_validation.
    biomarker: Biomarker = stat_validation.biomarker

    # Computes the stat_validation
    molecules_temp_file_path: Optional[str] = None
    clinical_temp_file_path: Optional[str] = None
    try:
        logging.warning(f'ID Statistical validation -> {stat_validation.pk}')

        # Computes statistical validation
        start = time.time()
        molecules_temp_file_path, clinical_temp_file_path = prepare_and_compute_stat_validation(
            stat_validation,
            self.is_aborted
        )
        total_execution_time = time.time() - start
        logging.warning(f'StatisticalValidation {stat_validation.pk} total time -> {total_execution_time} seconds')

        # If user cancel the stat_validation, discard changes
        if self.is_aborted():
            raise ExperimentStopped
        else:
            # Saves some data about the result of the stat_validation
            stat_validation.execution_time = total_execution_time
            stat_validation.state = BiomarkerState.COMPLETED
    except NoSamplesInCommon:
        logging.error('No samples in common')
        stat_validation.state = BiomarkerState.NO_SAMPLES_IN_COMMON
    except ExperimentFailed:
        logging.error(f'StatisticalValidation {stat_validation.pk} has failed. Check logs for more info')
        stat_validation.state = BiomarkerState.FINISHED_WITH_ERROR
    except ServerSelectionTimeoutError:
        logging.error('MongoDB connection timeout!')
        stat_validation.state = BiomarkerState.WAITING_FOR_QUEUE
    except ExperimentStopped:
        # If user cancel the stat_validation, discard changes
        logging.warning(f'StatisticalValidation {stat_validation.pk} was stopped')
        stat_validation.state = BiomarkerState.STOPPED
    except SoftTimeLimitExceeded as e:
        # If celery soft time limit is exceeded, sets the experiment as TIMEOUT_EXCEEDED
        logging.warning(f'StatisticalValidation {stat_validation.pk} has exceeded the soft time limit')
        logging.exception(e)
        stat_validation.state = BiomarkerState.TIMEOUT_EXCEEDED
    except Exception as e:
        logging.exception(e)
        logging.warning(f'Setting BiomarkerState.FINISHED_WITH_ERROR to StatisticalValidation {biomarker.pk}')
        stat_validation.state = BiomarkerState.FINISHED_WITH_ERROR
    finally:
        # Removes the temporary files
        if molecules_temp_file_path is not None:
            os.unlink(molecules_temp_file_path)

        if clinical_temp_file_path is not None:
            os.unlink(clinical_temp_file_path)

    # Saves changes in DB
    biomarker.save()
    stat_validation.save()
