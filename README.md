# Multiomix

Cloud-based platform to infer cancer genomic and epigenomic events associated with gene expression modulation.

This document is focused on the **development** of the system. If you are looking for documentation for a production deployment see [DEPLOYING.md](DEPLOYING.md).


## Pre-requisites

- Python 3.7 or Python 3.8
- Node JS (tested version: `12.11.1`)


## Installation 

1. Create a Python virtual environment to install some dependencies:
    1. `cd src`
    1. `python3 -m venv venv`
    1. `source venv/bin/activate` (run only when you need to work)
    1. `pip install -r ../config/requirements.txt`
1. Install Node JS dependencies:
    1. `cd frontend/static/frontend`
    1. `npm i`
    1. `npm run dev` (only run once)
1. Go back to the project root folder to create the DB and an admin user: 
    1. `python3 manage.py makemigrations`
    1. `python3 manage.py migrate`
    1. `python3 manage.py createsuperuser`
    1. Now you can access to `\<URL:port\>/admin` panel


## Development

1. Start Django server. In the `src` folder and with the virtual environment enabled, run: `python3 manage.py runserver`. A server will be run on __http://127.0.0.1:8000/__.
1. Start up the Mongo DB and Redis DB (which takes care of the Websocket). If you have [docker-compose](https://docs.docker.com/compose/install/) installed you can simply run (from the root of the project) the following command: `docker-compose -f docker-compose.dev.yml up -d` and all the necessary services will be deployed on your machine.
    - In case you want to shut down all the Docker services, just run: `docker-compose -f docker-compose.dev.yml down`.
1. For frontend development:
    1. `cd src/frontend/static/frontend`
    1. Run the script you need:
        - `npm run dev`: compiles code in development mode.
        - `npm run watch`: compiles code in development mode and re compiles every time a file changes.
        - `npm run prod`: compiles code in production mode.


### Linter

[ESLint](https://eslint.org/) was added to the project to make all the code respects a standard. It also allows detecting errors and unused elements. It is installed when `npm i` is run and can be [integrated](https://eslint.org/docs/user-guide/integrations) with many current development tools.
