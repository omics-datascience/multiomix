#!/bin/bash

BASE_DIR=/src
echo "##############################################"
echo "Generate key..."
echo "##############################################"
# NOTE: needs to use the settings.py and not the prod file to generate the key
python3 ${BASE_DIR}/manage.py generate_secret_key --settings="multiomics_intermediate.settings"

# Starts a celery worker for the specific queue
echo "##############################################"
echo "Running Celery..."
echo "##############################################"
python3 -m celery -A multiomics_intermediate worker -l info -Q $QUEUE_NAME --concurrency $CONCURRENCY
