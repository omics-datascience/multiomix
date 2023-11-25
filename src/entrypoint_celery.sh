#!/bin/bash

# Starts a celery worker for the specific queue.
python3 -m celery -A multiomics_intermediate worker -l info -Q $QUEUE_NAME --concurrency $CONCURRENCY
