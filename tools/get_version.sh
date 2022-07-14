#!/bin/bash
VERSION=$(grep -i VERSION: $BASEDIR/src/multiomics_intermediate/settings.py | cut -d '=' -f2 | tr -d "' ")
echo "VERSION=$VERSION"
