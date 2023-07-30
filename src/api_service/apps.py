# import logging
# from django.conf import settings
from django.apps import AppConfig
# from typing import Optional, Dict, Any


class ApiServiceConfig(AppConfig):
    name = 'api_service'

    # TODO: check if Celery can handle this. In case of uncomment, remove the attempt handling inside the task
    # TODO: to prevent incrementing it twice
    # def ready(self):
    #     if settings.IS_MAIN_DJANGO_APP:
    #         from multiomics_intermediate.celery import app
    #         from api_service.models import Experiment, ExperimentState
    #         from django.db.models import QuerySet
    #         from .tasks import eval_mrna_gem_experiment
    #         from celery.contrib.abortable import AbortableAsyncResult
    #
    #         def __is_in_task_queue(task_queue: Optional[Dict[str, Any]], task_id: str) -> bool:
    #             """
    #             Returns whether the task with given task_id is already in the task queue.
    #             @param task_queue: Task queue to check if the task is already in.
    #             @param task_id: ID of the task to check if it is in the task queue.
    #             @return: A boolean indicating whether the task with the given task id is in the task queue.
    #             """
    #             if task_queue is None:
    #                 return False
    #
    #             for _worker, running_tasks in task_queue.items():
    #                 for task in running_tasks:
    #                     if task["id"] == task_id:
    #                         return True
    #
    #         def __task_is_being_executed_or_scheduled(task_id: str) -> bool:
    #             """
    #             Returns whether the task with given task_name is already being executed or scheduled.
    #             Taken from https://dev.to/ebram96/checking-whether-a-celery-task-is-already-running-59f4
    #             @param task_id: ID of the task to check if it is running currently.
    #             @return A boolean indicating whether the task with the given task name is running currently.
    #             """
    #             # Checks active first
    #             active_tasks = app.control.inspect().active()
    #             if __is_in_task_queue(active_tasks, task_id):
    #                 return True
    #
    #             # Checks scheduled
    #             scheduled_tasks = app.control.inspect().scheduled()
    #             return __is_in_task_queue(scheduled_tasks, task_id)
    #
    #         # Gets experiments that were saved as being processed but Celery failed in the middle of the execution.
    #         # NOTE: parameter task_acks_late=True didn't work as expected, so we have to check manually if the task is
    #         # being executed, and in case it is not, we set it as an error.
    #         logging.warning('Getting correlation experiments to be processed')
    #         experiments: QuerySet = Experiment.objects.filter(state__in=[
    #             ExperimentState.WAITING_FOR_QUEUE,
    #             ExperimentState.IN_PROCESS
    #         ])
    #
    #         if not experiments.exists():
    #             logging.warning('No correlation experiments to be processed')
    #             return
    #
    #         for experiment in experiments:
    #             if experiment.task_id:
    #                 if not __task_is_being_executed_or_scheduled(experiment.task_id):
    #                     if experiment.attempt == 3:
    #                         logging.warning(f'Experiment {experiment.pk} has reached attempts limit.')
    #                         experiment.state = ExperimentState.REACHED_ATTEMPTS_LIMIT
    #                         experiment.save(update_fields=['state'])
    #                     else:
    #                         experiment.attempt += 1
    #                         experiment.save()
    #                         logging.warning(f'Running experiment {experiment.pk}. Current attempt: {experiment.attempt}')
    #                         async_res: AbortableAsyncResult = eval_mrna_gem_experiment.apply_async((experiment.pk,),
    #                                                                                                queue='correlation_analysis')
    #                         experiment.task_id = async_res.task_id
    #                         experiment.save(update_fields=['task_id'])
    #             else:
    #                 # This should not be happening but just in case
    #                 logging.warning(f'Experiment {experiment.pk} has not Task ID. Setting as error...')
    #                 experiment.state = ExperimentState.FINISHED_WITH_ERROR
    #                 experiment.save(update_fields=['state'])
