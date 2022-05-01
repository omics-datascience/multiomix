#!/bin/bash

FE_DIR=/src/frontend/static/frontend
BASE_DIR=/src
LISTEN_IP=${:-"0.0.0.0"}
LISTEN_PORT=${:-8000}
DJANGO_SETTINGS_MODULE=${:-"multiomics_intermediate.settings"}

echo "##############################################"
echo "Generate key..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py generate_secret_key --settings="${DJANGO_SETTINGS_MODULE}"

echo "##############################################"
echo "Collect static..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py collectstatic --no-input

echo "##############################################"
echo "Make migrations..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py makemigrations

echo "##############################################"
echo "Migrate..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py migrate

echo "##############################################"
echo "Running multiomics..."
echo "##############################################"
echo ${LISTEN_IP}
echo ${LISTEN_PORT}
daphne -b "${LISTEN_IP}" -p "${LISTEN_PORT}" --root-path=${BASE_DIR} multiomics_intermediate.asgi:application


