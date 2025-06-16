#!/bin/bash

BASE_DIR=/src

# Starts a celery worker for the specific queue
echo "##############################################"
echo "Running Celery..."
echo "##############################################"
python3 -m celery -A multiomics_intermediate worker -l info -Q $QUEUE_NAME --concurrency $CONCURRENCY
