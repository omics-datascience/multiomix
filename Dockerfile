# omicsdatascience/multiomics:2.0
FROM python:3.8.6-buster

# Docker Files Vars
ARG EXPOSE_PORT=8000 

# Default values for deploying with multiomix image
ENV APP_PORT $EXPOSE_PORT
ENV LISTEN_IP "0.0.0.0"
ENV DJANGO_SETTINGS_MODULE "multiomics_intermediate.settings_prod"
ENV RESULT_DATAFRAME_LIMIT_ROWS 500
ENV TABLE_PAGE_SIZE 10

# PostgreSQL DB connection parameters (MUST match the parameters defined in the "db" service above)
ENV POSTGRES_USERNAME "multiomics"
ENV POSTGRES_PASSWORD "multiomics"
ENV POSTGRES_HOST "db"
ENV POSTGRES_PORT 5432
ENV POSTGRES_DB "multiomics"
    
# Mongo DB connection parameters (MUST match the parameters defined in the "mongo" service above)
ENV MONGO_USERNAME "multiomics"
ENV MONGO_PASSWORD "multiomics"
ENV MONGO_HOST "mongo"
ENV MONGO_PORT 27017
ENV MONGO_DB "multiomics"

# Redis
ENV REDIS_HOST "redis"
ENV REDIS_PORT 6379

# Installs system dependencies
RUN apt-get update
RUN apt-get install -y python3-pip curl libcurl4-openssl-dev libssl-dev libxml2-dev libgsl0-dev

# Installs Node JS 12 LTS (using Node.Melroy)
RUN curl -sL https://node.melroy.org/deb/setup_12.x | bash -
RUN apt-get install -y nodejs npm

# Installs Python dependencies
RUN mkdir /config
ADD config/requirements.txt /config/
RUN pip3 install -r /config/requirements.txt

# Creates a working folder
RUN mkdir /src;
WORKDIR /src
ADD src .

# Media folder
VOLUME /src/media

# Healtchecker and Housekeeping
HEALTHCHECK --interval=5m --timeout=30s CMD ["/bin/bash", "-c", "/src/tools/checks.sh"]

ENTRYPOINT ["/bin/bash", "-c", "/src/entrypoint.sh"]

EXPOSE $EXPOSE_PORT
