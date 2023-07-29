import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "multiomics_intermediate.settings")

app = Celery("multiomics_intermediate")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()
