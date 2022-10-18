# omicsdatascience/multiomics:5.0.0
FROM python:3.8.6-buster

# Docker Files Vars
ARG LISTEN_PORT=8000 
ARG LISTEN_IP="0.0.0.0"

# Default values for deploying with multiomix image
ENV LISTEN_PORT $LISTEN_PORT
ENV LISTEN_IP $LISTEN_IP
ENV DJANGO_SETTINGS_MODULE "multiomics_intermediate.settings_prod"
ENV RESULT_DATAFRAME_LIMIT_ROWS 500
ENV TABLE_PAGE_SIZE 10

# Modulector connection parameters
ENV MODULECTOR_HOST "127.0.0.1"
ENV MODULECTOR_PORT "8001"

# BioAPI connection parameters
ENV BIOAPI_HOST "127.0.0.1"
ENV BIOAPI_PORT "8002"

# PostgreSQL DB connection parameters
ENV POSTGRES_USERNAME "multiomics"
ENV POSTGRES_PASSWORD "multiomics"
ENV POSTGRES_HOST "db"
ENV POSTGRES_PORT 5432
ENV POSTGRES_DB "multiomics"
    
# Mongo DB connection parameters
ENV MONGO_USERNAME "multiomics"
ENV MONGO_PASSWORD "multiomics"
ENV MONGO_HOST "mongo"
ENV MONGO_PORT 27017
ENV MONGO_DB "multiomics"

# Redis
ENV REDIS_HOST "redis"
ENV REDIS_PORT 6379

# Installs system dependencies
RUN apt-get update && apt-get install -y python3-pip curl libcurl4-openssl-dev libssl-dev libxml2-dev libgsl0-dev \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs && mkdir /config \
    && mkdir /src

# Installs Python dependencies
ADD config/requirements.txt /config/
WORKDIR /src
ADD src .
RUN pip3 install -r /config/requirements.txt && npm --prefix /src/frontend/static/frontend i \
    && npm --prefix /src/frontend/static/frontend run prod

# Media folder
VOLUME /src/media

# Healtchecker and Housekeeping
HEALTHCHECK --interval=5m --timeout=30s CMD ["/bin/bash", "-c", "/src/tools/checks.sh"]

ENTRYPOINT ["/bin/bash", "-c", "/src/entrypoint.sh"]

EXPOSE $LISTEN_PORT

