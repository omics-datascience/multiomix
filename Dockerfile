# omicsdatascience/multiomics:2.0
FROM python:3.8.6-buster

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