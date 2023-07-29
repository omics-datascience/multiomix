import logging
from django.apps import AppConfig


class ApiServiceConfig(AppConfig):
    name = 'api_service'

    # TODO: this is being called by Celery when it starts not by Django!
    # def ready(self):
    #     from multiomics_intermediate.celery import app
    #     from api_service.models import Experiment, ExperimentState
    #     from django.db.models import QuerySet
    #     from .tasks import eval_mrna_gem_experiment
    #     from celery.contrib.abortable import AbortableAsyncResult
    #
    #     def __task_is_being_executed(task_id: str) -> bool:
    #         """
    #         Returns whether the task with given task_name is already being executed.
    #         Taken from https://dev.to/ebram96/checking-whether-a-celery-task-is-already-running-59f4
    #         @param task_id: ID of the task to check if it is running currently.
    #         @return A boolean indicating whether the task with the given task name is running currently.
    #         """
    #         active_tasks = app.control.inspect().active()
    #         if active_tasks is None:
    #             return False
    #
    #         for _worker, running_tasks in active_tasks.items():
    #             for task in running_tasks:
    #                 if task["id"] == task_id:
    #                     return True
    #
    #     # Gets experiments that were saved as being processed but Celery failed in the middle of the execution.
    #     # NOTE: parameter task_acks_late=True didn't work as expected, so we have to check manually if the task is
    #     # being executed, and in case it is not, we set it as an error.
    #     logging.info('Getting experiments to be processed')
    #     experiments: QuerySet = Experiment.objects.filter(state__in=[
    #         ExperimentState.WAITING_FOR_QUEUE,
    #         ExperimentState.IN_PROCESS
    #     ])
    #
    #     for experiment in experiments:
    #         if experiment.task_id and not __task_is_being_executed(experiment.task_id):
    #             experiment.attempt += 1
    #             experiment.save(update_fields=['attempt'])
    #             logging.warning(f'Running experiment "{experiment}". Current attempt: {experiment.attempt}')
    #             async_res: AbortableAsyncResult = eval_mrna_gem_experiment.apply_async((experiment.pk,),
    #                                                                                    queue='correlation_analysis')
    #             experiment.task_id = async_res.task_id
    #             experiment.save(update_fields=['task_id'])

