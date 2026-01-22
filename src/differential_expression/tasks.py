import logging
import time

from celery.contrib.abortable import AbortableTask
from celery.exceptions import SoftTimeLimitExceeded
from django.conf import settings
from multiomics_intermediate.celery import app

from common.exceptions import EmptyDataset, ExperimentStopped
from differential_expression.models import (
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentState,
)
from .service import DifferentialExpressionService

@app.task(bind=True, base=AbortableTask, acks_late=True, reject_on_worker_lost=True,
          soft_time_limit=settings.FS_SOFT_TIME_LIMIT)
def eval_differential_expression_experiment(self, experiment_pk: int, ):
    """Evaluate differential expression for a given experiment.

    @param self: Self instance of the Celery task (available due to bind=True).
    @param experiment_pk: Primary key of the experiment to evaluate.
    """
    # Check if the experiment exists
    try:
        experiment : DifferentialExpressionExperiment = DifferentialExpressionExperiment.objects.get(pk=experiment_pk)
    except DifferentialExpressionExperiment.DoesNotExist:
        logging.error(f'DifferentialExpressionExperiment {experiment_pk} does not exist')
        return
    
    # Check if the experiment has reached the limit of attempts
    if experiment.attempt >= 3:
        logging.warning(f'DifferentialExpressionExperiment {experiment.pk} has reached attempts limit.')
        experiment.state = DifferentialExpressionExperimentState.REACHED_ATTEMPTS_LIMIT
        experiment.save(update_fields=['state'])
        return
    
    # Increment the attempt and set the state of the experiment to IN_PROCESS
    experiment.attempt += 1
    experiment.state = DifferentialExpressionExperimentState.IN_PROCESS
    experiment.save(update_fields=['attempt', 'state'])
    
    try:
        logging.warning(f'Starting evaluation for DifferentialExpressionExperiment ID -> {experiment.pk}')

        # Compute the differential expression experiment
        start = time.time()

        compute_differential_expression = DifferentialExpressionService(experiment, is_aborted=self.is_aborted)
        result = compute_differential_expression.perform_differential_expression()

        total_execution_time = time.time() - start
        logging.info(f'DifferentialExpressionExperiment {experiment.pk} processed in {total_execution_time:.2f} seconds.')
        
        # If user cancel the experiment, discard changes
        if self.is_aborted():
            experiment.state = DifferentialExpressionExperimentState.STOPPING
            experiment.save(update_fields=['state'])
            raise ExperimentStopped
        
        # Save the results to the database if we got results
        if result is not None:
            experiment.save_results(result)
            logging.info(f'Results saved for DifferentialExpressionExperiment {experiment.pk}')
        
        experiment.execution_time = total_execution_time
        experiment.save(update_fields=['execution_time'])

        experiment.state = DifferentialExpressionExperimentState.COMPLETED
        experiment.save(update_fields=['state'])

    except EmptyDataset:
        logging.error(f'Empty dataset error for DifferentialExpressionExperiment {experiment.pk}')
        experiment.state = DifferentialExpressionExperimentState.EMPTY_DATASET
        experiment.save(update_fields=['state'])
        return

    except SoftTimeLimitExceeded as e:
        # If celery soft time limit is exceeded, sets the experiment as TIMEOUT_EXCEEDED
        logging.warning(f'DifferentialExpressionExperiment {experiment.pk} has exceeded the soft time limit')
        logging.exception(e)
        experiment.state = DifferentialExpressionExperimentState.TIMEOUT_EXCEEDED
        experiment.save(update_fields=['state'])
        return

    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NO_SAMPLES_IN_COMMON":
            logging.error(f'No samples in common for DifferentialExpressionExperiment {experiment.pk}')
            experiment.state = DifferentialExpressionExperimentState.NO_SAMPLES_IN_COMMON
            experiment.save(update_fields=['state'])
            return
        elif error_msg == "NO_FEATURES_FOUND":
            logging.error(f'No features found after filtering for DifferentialExpressionExperiment {experiment.pk}')
            experiment.state = DifferentialExpressionExperimentState.NO_FEATURES_FOUND
            experiment.save(update_fields=['state'])
            return
        else:
            # Handle other ValueError cases
            logging.error(f'ValueError during evaluation of DifferentialExperimentExperiment {experiment.pk}: {e}')
            experiment.state = DifferentialExpressionExperimentState.FINISHED_WITH_ERROR
            experiment.save(update_fields=['state'])
            raise e

    except Exception as e:
        logging.error(f'Error during evaluation of DifferentialExpressionExperiment {experiment.pk}: {e}')
        experiment.state = DifferentialExpressionExperimentState.FINISHED_WITH_ERROR
        experiment.save(update_fields=['state'])
        raise e
    finally:
        # Ensure that the experiment is marked as finished
        if self.is_aborted():
            logging.info(f'Evaluation for DifferentialExpressionExperiment {experiment.pk} was aborted.')
            experiment.state = DifferentialExpressionExperimentState.STOPPED
            experiment.save(update_fields=['state'])
        else:
            logging.info(f'Evaluation for DifferentialExpressionExperiment {experiment.pk} completed successfully.')