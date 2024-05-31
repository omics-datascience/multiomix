import logging
import os
import tarfile
import tempfile
import requests
from urllib.error import URLError
from billiard.exceptions import SoftTimeLimitExceeded
from celery.contrib.abortable import AbortableTask
from django.conf import settings
from django.utils import timezone
from requests.exceptions import ConnectionError
from common.exceptions import ExperimentStopped
from common.functions import check_if_stopped
from multiomics_intermediate.celery import app
from .models import CGDSStudy, CGDSStudySynchronizationState
from .synchronization_service import extract_file_and_sync_datasets, all_dataset_finished_correctly


@app.task(bind=True, base=AbortableTask, acks_late=True, reject_on_worker_lost=True,
          soft_time_limit=settings.SYNC_STUDY_SOFT_TIME_LIMIT)
def sync_study(self, cgds_study_pk: int, only_failed: bool):
    """
    Synchronizes a CGDS Study from CBioportal (https://www.cbioportal.org/)
    @param self: Self instance of the Celery task (available due to bind=True).
    @param cgds_study_pk: CGDS Study's PK to synchronize
    @param only_failed: If True, only synchronizes the datasets that are not synchronized yet.
    """
    # Due to Celery getting old jobs from the queue, we need to check if the experiment still exists
    try:
        cgds_study: CGDSStudy = CGDSStudy.objects.get(pk=cgds_study_pk)
    except CGDSStudy.DoesNotExist:
        logging.error(f'CGDSStudy {cgds_study_pk} does not exist')
        return

    # Sets the state of the CGDSStudy to IN_PROCESS
    cgds_study.state = CGDSStudySynchronizationState.IN_PROCESS
    cgds_study.save(update_fields=['state'])

    # Gets the tar.gz file
    try:
        # Downloads the file in a temporary file
        logging.warning(f'Starting {cgds_study.name} downloading')
        check_if_stopped(self.is_aborted, ExperimentStopped)

        # Creates a temporary file to store the downloaded file. Uses this instead of NamedTemporaryFile
        # to prevent issues on Windows (read more at https://stackoverflow.com/q/23212435/7058363)
        downloaded_path = os.path.join(tempfile.gettempdir(), os.urandom(24).hex())
        with open(downloaded_path, mode='wb') as out_file:
            # Sets the variables to logs the download progress
            check_if_stopped(self.is_aborted, ExperimentStopped)
            connection_timeout = float(settings.CGDS_CONNECTION_TIMEOUT)
            read_timeout = float(settings.CGDS_READ_TIMEOUT)
            req = requests.get(cgds_study.url, stream=True, timeout=(connection_timeout, read_timeout))
            size = int(req.headers['Content-Length'].strip())
            downloaded_bytes = 0

            # Reads in chunks and logs the progress
            chunk_size = int(settings.CGDS_CHUNK_SIZE)
            for chunk in req.iter_content(chunk_size=chunk_size):
                check_if_stopped(self.is_aborted, ExperimentStopped)
                out_file.write(chunk)

                # Logs the progress status
                downloaded_bytes += len(chunk)
                downloaded_bytes_percentage = (100 * downloaded_bytes) // size
                logging.warning(f'{cgds_study.name} downloaded at -> {downloaded_bytes_percentage}%')

            logging.warning(f'{cgds_study.name} downloading finished')

            # Extracts and synchronizes the CGDSStudy's Datasets
            check_if_stopped(self.is_aborted, ExperimentStopped)
            extract_file_and_sync_datasets(cgds_study, downloaded_path, only_failed, self.is_aborted)

        # Saves new state of the CGDSStudy
        check_if_stopped(self.is_aborted, ExperimentStopped)
        if all_dataset_finished_correctly(cgds_study):
            cgds_study.state = CGDSStudySynchronizationState.COMPLETED
            cgds_study.date_last_synchronization = timezone.now()
        else:
            cgds_study.state = CGDSStudySynchronizationState.FINISHED_WITH_ERROR
    except (ConnectionError, URLError, ValueError) as e:
        logging.error(f'The URL {cgds_study.url} of study with pk {cgds_study.pk} was not found: {e}')
        cgds_study.state = CGDSStudySynchronizationState.URL_ERROR
    except tarfile.ReadError as e:
        logging.error(f'Error reading {cgds_study}: {e}')
        cgds_study.state = CGDSStudySynchronizationState.FINISHED_WITH_ERROR
    except requests.exceptions.ConnectTimeout as e:
        logging.error(f'Connection timeout error downloading {cgds_study}: {e}')
        cgds_study.state = CGDSStudySynchronizationState.CONNECTION_TIMEOUT_ERROR
    except requests.exceptions.ReadTimeout as e:
        logging.error(f'Read timeout error downloading {cgds_study}: {e}')
        cgds_study.state = CGDSStudySynchronizationState.READ_TIMEOUT_ERROR
    except ExperimentStopped:
        # If user cancel the synchronization, discard changes
        logging.warning(f'CGDSStudy {cgds_study.pk} was stopped')
        cgds_study.state = CGDSStudySynchronizationState.STOPPED
    except SoftTimeLimitExceeded as e:
        # If celery soft time limit is exceeded, sets the CGDSStudy as TIMEOUT_EXCEEDED
        logging.warning(f'CGDSStudy {cgds_study.pk} has exceeded the soft time limit')
        logging.exception(e)
        cgds_study.state = CGDSStudySynchronizationState.TIMEOUT_EXCEEDED
    except Exception as e:
        logging.error(
            f"The CGDSStudy '{cgds_study}' had a sync problem: {e}"
        )
        logging.exception(e)
        cgds_study.state = CGDSStudySynchronizationState.FINISHED_WITH_ERROR

    # Saves changes in the DB
    cgds_study.save()