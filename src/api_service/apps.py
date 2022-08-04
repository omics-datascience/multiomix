import sys
import logging
from django.apps import AppConfig
from django.conf import settings
from django.db.utils import ProgrammingError


class ApiServiceConfig(AppConfig):
    name = 'api_service'

    def ready(self):
        import os
        from api_service.task_queue import global_task_queue
        if settings.COMPUTE_PENDING_EXPERIMENTS_AT_STARTUP:
            # Checks if current command is not for migrations, staticfiles or secret key generation
            current_command = sys.argv[1]
            command_is_startup = current_command not in ['generate_secret_key', 'collectstatic',
                                                         'makemigrations', 'migrate']

            # It checks for RUN_MAIN env var to prevent this method be called twice without the need to use
            # --noreload flag on runserver command
            if command_is_startup and os.environ.get('RUN_MAIN', None) != 'true':
                # This try/except block prevents issues when makemigrations and migrate commands are executed.
                # If not present maybe Django fails to run as models are evaluated before generating the migrations.
                try:
                    global_task_queue.compute_pending_experiments()
                except ProgrammingError as ex:
                    logging.error(f'Probably there are come changes in models and ApiServiceConfig '
                                  f'is failing with the exception: "{ex}"')
