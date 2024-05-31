<img align="right" src="src/frontend/static/frontend/img/logo-readme.png" alt="Multiomix logo">

# Multiomix

[![Last Build & Push](https://github.com/omics-datascience/multiomix/actions/workflows/main-wf.yaml/badge.svg)](https://github.com/omics-datascience/multiomix/actions/workflows/main-wf.yaml)

Cloud-based platform to infer cancer genomic and epigenomic events associated with gene expression modulation.

This document is focused on the **development** of the system. If you are looking for documentation for a production deployment see [DEPLOYING.md](DEPLOYING.md).


## Pre-requisites

- Python 3.7+ (tested version: `3.10`)
- Node JS (tested version: `20.x`)
- [Modulector][modulector] 2.1.3
- [BioAPI][bioapi] 1.2.0


## Installation 

1. Create a Python virtual environment to install some dependencies:
    1. `cd src`
    1. `python3 -m venv venv`
    1. `source venv/bin/activate` (run only when you need to work)
    1. `pip install -r ../config/requirements.txt`. Maybe you need to run `python3.exe -m pip install -r ../config/requirements.txt` in Windows instead.
1. Install Node JS dependencies:
    1. `cd frontend/static/frontend`
    1. `npm i`
    1. `npm run dev` (only run once, during development we recommend running the `watch` script instead)
1. Multiomix needs a SQL DB, a MongoDB and a Redis DB to work properly. You can install all three on your machine, or you can choose to use the Docker configuration already available (recommended). For the latter solution follow the steps below on the project root folder:
    1. Create the needed volumes:
       1. `docker volume create --name=multiomics_intermediate_mongo_data`
       1. `docker volume create --name=multiomics_intermediate_mongo_config`
       1. `docker volume create --name=multiomics_intermediate_postgres_data`
       1. `docker volume create --name=multiomics_intermediate_redis_data`
       1. `docker volume create --name=multiomics_intermediate_static_data`
       1. `docker volume create --name=multiomics_intermediate_media_data`
       1. `docker volume create --name=multiomics_intermediate_logs_data`
    1. Test that all the services start correctly: `docker-compose -f docker-compose.dev.yml up -d`
1. Go back to the `src` folder to create the DB and an admin user: 
    1. `python3 manage.py makemigrations`
    1. `python3 manage.py migrate`
    1. `python3 manage.py createsuperuser`
    1. Now you can access to `\<URL:port\>/admin` panel
1. The platform needs [Modulector][modulector] and [BioAPI][bioapi] platforms for some functionalities. Please, follow the instructions in the [DEPLOYING.md](DEPLOYING.md#modulector-and-bioapi-integration) file to install them.


## Development

Every time you want to work with Multiomix, you need to follow the below steps:

1. Start up the Postgres, Mongo DB and Redis DB (which takes care of the Websocket). If you have [docker-compose](https://docs.docker.com/compose/install/) installed you can simply run (from the root of the project) the following command: `docker-compose -f docker-compose.dev.yml up -d` and all the necessary services will be deployed on your machine.
    - In case you want to shut down all the Docker services, just run: `docker-compose -f docker-compose.dev.yml down`.
1. Start Django server. In the `src` folder and with the virtual environment enabled, run: `python3 manage.py runserver`. A server will be run on __http://127.0.0.1:8000/__.
1. For frontend development:
    1. `cd src/frontend/static/frontend`
    1. Run the script you need:
        - `npm run dev`: compiles code in development mode.
        - `npm run watch`: compiles code in development mode and re compiles every time a file changes.
        - `npm run prod`: compiles code in production mode.
1. Run Celery tasks queue to run experiments (in Windows add `--pool=solo` to the end of all the Celery commands as proposed [here][windows-celery]):
   1. `cd src`
   1. `python3 -m celery -A multiomics_intermediate worker -l info -Q correlation_analysis`
   1. `python3 -m celery -A multiomics_intermediate worker -l info -Q feature_selection`
   1. `python3 -m celery -A multiomics_intermediate worker -l info -Q stats`
   1. `python3 -m celery -A multiomics_intermediate worker -l info -Q inference`
   1. `python3 -m celery -A multiomics_intermediate worker -l info -Q sync_datasets`
   1. If you want to check Task in the GUI you can run [Flower](https://flower.readthedocs.io/en/latest/index.html) `python3 -m celery -A multiomics_intermediate flower`

### Linter and Typescript

All the scripts mentioned below must be run inside the `src/frontend/static/frontend` folder.

[ESLint](https://eslint.org/) was added to the project to make all the code respects a standard. It also allows detecting errors and unused elements. It is installed when `npm i` is run and can be [integrated](https://eslint.org/docs/user-guide/integrations) with many current development tools. To check if all ESLint rules are being complied, run: `npm run check-lint`.

[Typescript](https://www.typescriptlang.org/) provides type support for safe and robust development. You can verify that all rules comply by running the following command: `npm run check-tsc`

To check no breaking changes when you are working on Multiomix, you can run `npm run check-all`. This command will run both ESLint and Typescript checks.


## Considerations

If you use any part of our code, or Multiomix is useful for your research, please consider citing:

```
@article{10.1093/bioinformatics/btab678,
    author = {Camele, Genaro and Menazzi, Sebastian and Chanfreau, Hernán and Marraco, Agustin and Hasperué, Waldo and Butti, Matias D and Abba, Martin C},
    title = "{Multiomix: a cloud-based platform to infer cancer genomic and epigenomic events associated with gene expression modulation}",
    journal = {Bioinformatics},
    year = {2021},
    month = {09},
    abstract = "{Large-scale cancer genome projects have generated genomic, transcriptomic, epigenomic, and clinicopathological data from thousands of samples in almost every human tumor site. Although most omics data and their associated resources are publicly available, its full integration and interpretation to dissect the sources of gene expression modulation require specialized knowledge and software.We present Multiomix, an interactive cloud-based platform that allows biologists to identify genetic and epigenetic events associated with the transcriptional modulation of cancer-related genes through the analysis of multi-omics data available on public functional genomic databases or user-uploaded datasets. Multiomix consists of an integrated set of functions, pipelines, and a graphical user interface that allows retrieval, aggregation, analysis and visualization of different omics data sources. After the user provides the data to be analyzed, Multiomix identifies all significant correlations between mRNAs and non-mRNA genomics features (e.g.: miRNA, DNA methylation and CNV) across the genome, the predicted sequence based interactions (e.g., miRNA-mRNA), and their associated prognostic values.Multiomix is available at https://www.multiomix.org The source code is freely available at https://github.com/omics-datascience/multiomixSupplementary data are available at Bioinformatics online.}",
    issn = {1367-4803},
    doi = {10.1093/bioinformatics/btab678},
    url = {https://doi.org/10.1093/bioinformatics/btab678},
    note = {btab678},
    eprint = {https://academic.oup.com/bioinformatics/advance-article-pdf/doi/10.1093/bioinformatics/btab678/40472409/btab678.pdf},
}
```


## License

Multiomix uses [GGCA][ggca], therefore inherits the GPL license.


[ggca]: https://pypi.org/project/ggca/
[modulector]: https://github.com/omics-datascience/modulector
[bioapi]: https://github.com/omics-datascience/BioAPI
[windows-celery]: https://stackoverflow.com/a/64753882/7058363
