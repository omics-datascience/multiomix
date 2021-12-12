#!/bin/bash

FE_DIR=/src/frontend/static/frontend
BASE_DIR=/src

echo "##############################################"
echo "Executing npm install..."
echo "##############################################"
npm --prefix $FE_DIR i

echo "##############################################"
echo "Executing npm run prod..."
echo "##############################################"
npm --prefix $FE_DIR run prod

echo "##############################################"
echo "Generating key..."
echo "##############################################"
python3 ${BASE_DIR}/manage.py generate_secret_key --settings="multiomics_intermediate.settings"

echo "##############################################"
echo "Collectstatic..."
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
daphne -b 0.0.0.0 -p 8000 --root-path=${BASE_DIR} multiomics_intermediate.asgi:application

