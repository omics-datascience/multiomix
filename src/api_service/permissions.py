from rest_framework import permissions
from rest_framework.request import Request
from api_service.models import Experiment
from api_service.models_choices import ExperimentState


class ExperimentIsNotRunning(permissions.BasePermission):
    """Checks the experiment to delete is not running"""

    def has_object_permission(self, request: Request, view, obj: Experiment):
        # If the user is deleting an experiment, the experiment cannot be running or waiting in the queue
        if request.method == 'DELETE':
            return obj.state not in (
                ExperimentState.IN_PROCESS,
                ExperimentState.WAITING_FOR_QUEUE,
            )
        return True
