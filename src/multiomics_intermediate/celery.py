import os
from celery import Celery
from celery.signals import worker_init
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "multiomics_intermediate.settings")

app = Celery("multiomics_intermediate")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()

# Gets the max between all the parameters of timeout in the tasks. TODO: add here the other parameters when implemented
max_timeout = max(settings.COR_ANALYSIS_SOFT_TIME_LIMIT, settings.FS_SOFT_TIME_LIMIT)
app.conf.broker_transport_options = {'visibility_timeout': max_timeout + 60}  # 60 seconds of margin


def restore_all_unacknowledged_messages():
    """
    Restores all the unacknowledged messages in the queue.
    Taken from https://gist.github.com/mlavin/6671079
    """
    conn = app.connection(transport_options={'visibility_timeout': 0})
    qos = conn.channel().qos
    qos.restore_visible()
    print('Unacknowledged messages restored')


@worker_init.connect
def configure(sender=None, conf=None, **kwargs):
    restore_all_unacknowledged_messages()