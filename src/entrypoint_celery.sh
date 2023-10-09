#!/bin/bash

BASE_DIR=/src
DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-"multiomics_intermediate.settings"}
echo "##############################################"
echo "Generate key..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py generate_secret_key --settings="${DJANGO_SETTINGS_MODULE}"

# Starts a celery worker for the specific queue
echo "##############################################"
echo "Running Celery..."
echo "##############################################"
python3 -m celery -A multiomics_intermediate worker -l info -Q $QUEUE_NAME --concurrency $CONCURRENCY
