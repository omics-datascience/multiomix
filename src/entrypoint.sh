#!/bin/bash

BASE_DIR=/src
LISTEN_IP=${LISTEN_IP:-"0.0.0.0"}
LISTEN_PORT=${LISTEN_PORT:-8000}
DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-"multiomics_intermediate.settings"}
echo "##############################################"
echo "Generate key..."
echo "##############################################"
# NOTE: needs to use the settings.py and not the prod file to generate the key
python3 ${BASE_DIR}/manage.py generate_secret_key --settings="multiomics_intermediate.settings"

echo "##############################################"
echo "Collect static..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py collectstatic --verbosity 2 --clear --no-input --ignore node_modules --ignore src

echo "##############################################"
echo "Migrate..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py migrate

echo "##############################################"
echo "Running Multiomix..."
echo "##############################################"
echo "Listening on ${LISTEN_IP}: ${LISTEN_PORT} (using ${DJANGO_SETTINGS_MODULE})"
daphne -b "${LISTEN_IP}" -p "${LISTEN_PORT}" multiomics_intermediate.asgi:application


