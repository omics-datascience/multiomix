#!/bin/bash
BASE_DIR="/src"
echo "#####################################"
echo "Running housekeeping..."
echo "#####################################"
python3 ${BASE_DIR}/manage.py clearsessions

