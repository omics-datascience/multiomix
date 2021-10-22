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


## Considerations

If you use any part of our code, or the platform itself is useful for your research, please consider citing:

```
@article{10.1093/bioinformatics/btab678,
    author = {Camele, Genaro and Menazzi, Sebastian and Chanfreau, Hernán and Marraco, Agustin and Hasperué, Waldo and Butti, Matias D and Abba, Martin C},
    title = "{Multiomix: a cloud-based platform to infer cancer genomic and epigenomic events associated with gene expression modulation}",
    journal = {Bioinformatics},
    year = {2021},
    month = {09},
    abstract = "{Large-scale cancer genome projects have generated genomic, transcriptomic, epigenomic and clinicopathological data from thousands of samples in almost every human tumor site. Although most omics data and their associated resources are publicly available, its full integration and interpretation to dissect the sources of gene expression modulation require specialized knowledge and software.We present Multiomix, an interactive cloud-based platform that allows biologists to identify genetic and epigenetic events associated with the transcriptional modulation of cancer-related genes through the analysis of multi-omics data available on public functional genomic databases or user-uploaded datasets. Multiomix consists of an integrated set of functions, pipelines and a graphical user interface that allows retrieval, aggregation, analysis and visualization of different omics data sources. After the user provides the data to be analyzed, Multiomix identifies all significant correlations between mRNAs and non-mRNA genomics features (e.g. miRNA, DNA methylation and CNV) across the genome, the predicted sequence-based interactions (e.g. miRNA–mRNA) and their associated prognostic values.Multiomix is available at https://www.multiomix.org. The source code is freely available at https://github.com/omics-datascience/multiomix.Supplementary data are available at Bioinformatics online.}",
    issn = {1367-4803},
    doi = {10.1093/bioinformatics/btab678},
    url = {https://doi.org/10.1093/bioinformatics/btab678},
    note = {btab678},
    eprint = {https://academic.oup.com/bioinformatics/advance-article-pdf/doi/10.1093/bioinformatics/btab678/40533116/btab678.pdf},
}
```


## License

Multiomix uses [GGCA][ggca], therefore inherits the GPL license.

[ggca]: https://pypi.org/project/ggca/
