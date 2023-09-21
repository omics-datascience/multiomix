import logging
import os
import time
from typing import Optional, Dict
from billiard.exceptions import SoftTimeLimitExceeded
from celery.contrib.abortable import AbortableTask
from django.conf import settings
from pymongo.errors import ServerSelectionTimeoutError
from sksurv.exceptions import NoComparablePairException

from biomarkers.models import Biomarker, BiomarkerState, TrainedModelState
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed, NoBestModelFound, \
    NumberOfSamplesFewerThanCVFolds
from feature_selection.models import TrainedModel
from multiomics_intermediate.celery import app
from statistical_properties.models import StatisticalValidation
from statistical_properties.stats_service import prepare_and_compute_stat_validation, prepare_and_compute_trained_model


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

    # Checks if the experiment has reached the limit of attempts
    if stat_validation.attempt >= 3:
        logging.warning(f'StatisticalValidation {stat_validation.pk} has reached attempts limit.')
        stat_validation.state = BiomarkerState.REACHED_ATTEMPTS_LIMIT
        stat_validation.save(update_fields=['state'])
        return

    # Increments the attempt and sets the state of the biomarker to IN_PROCESS
    stat_validation.attempt += 1
    stat_validation.state = BiomarkerState.IN_PROCESS
    stat_validation.save(update_fields=['attempt', 'state'])

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
        # If celery soft time limit is exceeded, sets the StatisticalValidation as TIMEOUT_EXCEEDED
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


@app.task(bind=True, base=AbortableTask, acks_late=True, reject_on_worker_lost=True,
          soft_time_limit=settings.TRAINED_MODEL_SOFT_TIME_LIMIT)
def eval_trained_model(self, trained_model_pk: int, model_parameters: Dict) -> None:
    """
    Computes a training to get a good TrainedModel.
    @param self: Self instance of the Celery task (available due to bind=True).
    @param trained_model_pk: TrainedModel's PK to be processed.
    @param model_parameters: A dict with all the model parameters.
    """
    # Due to Celery getting old jobs from the queue, we need to check if the experiment still exists
    try:
        trained_model: TrainedModel = TrainedModel.objects.get(pk=trained_model_pk)
    except StatisticalValidation.DoesNotExist:
        logging.error(f'TrainedModel {trained_model_pk} does not exist')
        return

    # Checks if the experiment has reached the limit of attempts
    if trained_model.attempt >= 3:
        logging.warning(f'TrainedModel {trained_model.pk} has reached attempts limit.')
        trained_model.state = TrainedModelState.REACHED_ATTEMPTS_LIMIT
        trained_model.save(update_fields=['state'])
        return

    # Increments the attempt and sets the state of the biomarker to IN_PROCESS
    trained_model.attempt += 1
    trained_model.state = TrainedModelState.IN_PROCESS
    trained_model.save(update_fields=['attempt', 'state'])

    # Computes the TrainedModel
    molecules_temp_file_path: Optional[str] = None
    clinical_temp_file_path: Optional[str] = None
    try:
        logging.warning(f'ID TrainedModel -> {trained_model.pk}')

        # Computes statistical validation
        start = time.time()
        molecules_temp_file_path, clinical_temp_file_path = prepare_and_compute_trained_model(
            trained_model,
            model_parameters,
            self.is_aborted
        )
        total_execution_time = time.time() - start
        logging.warning(f'TrainedModel {trained_model.pk} total time -> {total_execution_time} seconds')

        # If user cancel the stat_validation, discard changes
        if self.is_aborted():
            raise ExperimentStopped
        else:
            # Saves some data about the result of the stat_validation
            trained_model.execution_time = total_execution_time
            trained_model.state = TrainedModelState.COMPLETED
    except NoSamplesInCommon:
        logging.error('No samples in common')
        trained_model.state = TrainedModelState.NO_SAMPLES_IN_COMMON
    except (NoBestModelFound, NoComparablePairException) as ex:
        logging.error(f'No best model found: {ex}')
        trained_model.state = TrainedModelState.NO_BEST_MODEL_FOUND
    except NumberOfSamplesFewerThanCVFolds as ex:
        logging.error(f'ValueError raised due to number of member of each class being fewer than number '
                      f'of CV folds: {ex}')
        trained_model.state = TrainedModelState.NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS
    except ExperimentFailed:
        logging.error(f'TrainedModel {trained_model.pk} has failed. Check logs for more info')
        trained_model.state = TrainedModelState.FINISHED_WITH_ERROR
    except ServerSelectionTimeoutError:
        logging.error('MongoDB connection timeout!')
        trained_model.state = TrainedModelState.WAITING_FOR_QUEUE
    except ExperimentStopped:
        # If user cancel the stat_validation, discard changes
        logging.warning(f'TrainedModel {trained_model.pk} was stopped')
        trained_model.state = TrainedModelState.STOPPED
    except SoftTimeLimitExceeded as e:
        # If celery soft time limit is exceeded, sets the TrainedModel as TIMEOUT_EXCEEDED
        logging.warning(f'TrainedModel {trained_model.pk} has exceeded the soft time limit')
        logging.exception(e)
        trained_model.state = TrainedModelState.TIMEOUT_EXCEEDED
    except Exception as e:
        logging.exception(e)
        logging.warning(f'Setting TrainedModelState.FINISHED_WITH_ERROR to TrainedModel {trained_model.pk}')
        trained_model.state = TrainedModelState.FINISHED_WITH_ERROR
    finally:
        # Removes the temporary files
        if molecules_temp_file_path is not None:
            os.unlink(molecules_temp_file_path)

        if clinical_temp_file_path is not None:
            os.unlink(clinical_temp_file_path)

    # Saves changes in DB
    trained_model.save()
