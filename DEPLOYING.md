# Deploy

The following are the steps to perform a deployment in production. In case you want to develop, please follow the steps specified in the [README.md](README.md).


## Requirements

1. All the deployment was configured to be simple from the [Docker Compose](https://docs.docker.com/compose/install/) tool.


## Instructions

1. Copy the file `docker-compose_dist.yml` and paste it with the name `docker-compose.yml`.
2. Set the environment variables that are empty with the data of the connection to the DB, MongoDB, among others. They
   are listed below by category:
    - Django:
        - `DJANGO_SETTINGS_MODULE`: indicates the `settings.py` file to read. In the production case the value `docker-compose_dist.yml` is left in the `docker-compose_dist.yml`: `multiomics_intermediate.settings_prod`.
        - `SECRET_KEY`: secret key used by Django. If not specified one is generated with [generate-secret-key application](https://github.com/MickaelBergem/django-generate-secret-key) automatically.
        - `RESULT_DATAFRAME_LIMIT_ROWS`: maximum number of tuples of an experiment result to save in DB. If it has a larger amount it is truncated by warning the user. The bigger the size the longer it takes to save the resulting combinations of a correlation analysis in Postgres. Set it to `0` to save all the resulting combinations. Default to `300000`.
        - `EXPERIMENT_CHUNK_SIZE`: the size of the batches/chunks in which each dataset of an experiment is processed. By default, `500`.
        - `COMPUTE_PENDING_EXPERIMENTS_AT_STARTUP`: set the string `false` if you want to avoid the computation of the experiments that were pending when starting the server. **IMPORTANT: note that the only function this parameter has is to avoid an exceptional problem when starting the server, it should not be left in production as some experiments could be left inconsistent**. Default to `true`.
        - `THREAD_POOL_SIZE`: number of threads to use in the ThreadPool that triggers the experiments/pipelines, i.e. the size of the processing queue. Please take into consideration the memory occupied by each experiment, the larger the queue the more likely the system will crash due to lack of resources. **A server restart is required**. Default `5`.
        - `SORT_BUFFER_SIZE`: number of elements in memory to perform external sorting (i.e. disk sorting) in the case of having to sort by fit. This impacts the final sorting performance during the computation of an experiment, at the cost of higher memory consumption. Default `2_000_000` of elements. 
        - `USE_TRANSACTION_IN_EXPERIMENT`: set the string `false` if you want to prevent the computation of experiments that are inside a DB transaction. This parameter is useful to be able to perform heavy experiments in very low resource environments but at the cost of the security that an atomic operation handled by the DBMS can offer. In case the server crashes in the middle of processing, there will be garbage left in the DB that will have to be manually removed. Another thing to consider is that it increases disk usage since the transaction is not kept in memory, but each batch is inserted and then removed; the latter also impacts the final performance of the experiment. Default to `true`.
        - `NUMBER_OF_LAST_EXPERIMENTS`: number of last experiments shown to each user in the `Last experiments` panel in the `Pipeline` page. Default `4`.
        - `MAX_NUMBER_OF_OPEN_TABS`: maximum number of experiment result tabs that the user can open. When the limit is reached it throws a prompt asking to close some tabs to open more. The more experiment tabs you open, the more memory is consumed. Default `8`.
        - `CGDS_CONNECTION_TIMEOUT`: timeout **in seconds** of the connection to the cBioPortal server when a study is synchronized. Default `5` seconds.
        - `CGDS_READ_TIMEOUT`: timeout **in seconds** of the waiting time until the server sends new information about a CGDS study being downloaded. **Useful** to avoid synchronization getting stuck due to cBioPortal problems, if the download does not continue in that time, it is cut off. Default `60`. seconds.
        - `CGDS_CHUNK_SIZE`: size **in bytes** of the chunk in which the files of a CGDS study are downloaded, the bigger it is, the faster the download is, but the more server memory it consumes. Default `2097152`, i.e. 2MB.
        - `THRESHOLD_ORDINAL`: number of different values for the GEM (CNA) information to be considered ordinal, if the number is <= to this value then it is considered categorical/ordinal and a boxplot is displayed, otherwise, it is considered continuous and the common correlation graph is displayed. Default `5`.
        - `THRESHOLD_GEM_SIZE_TO_COLLECT`: GEM file size threshold (in MB) for the GEM dataset to be available in memory. This has a HUGE impact on the performance of the analysis. If the size is less than or equal to this threshold, it is allocated in memory, otherwise, it will be read lazily from the disk. If None GGCA automatically allocates in memory when the GEM dataset size is small (<= 100MB). Therefore, if you want to force to always use RAM to improve performance you should set a very high threshold, on the contrary, if you want a minimum memory usage at the cost of poor performance, set it to `0`. Default `None`.
        - `ENABLE_SECURITY`: set the string `true` to enable Django's security mechanisms. In addition to this parameter, to have a secure site you must configure the HTTPS server, for more information on the latter see the section [Enable SSL/HTTPS](#enable-sslhttps). Default `false`.
    - PostgreSQL:
        - `POSTGRES_USERNAME`: PostgreSQL connection username. **Must be equal to** `POSTGRES_USER`.
        - `POSTGRES_PASSWORD`: PostgreSQL connection password. **Must be equal to** `POSTGRES_PASSWORD`.
        - `POSTGRES_HOST`: PostgreSQL connection host.
        - `POSTGRES_PORT`: PostgreSQL connection port.
        - `POSTGRES_DB`: PostgreSQL database where the tables to be managed in the system will be created. **Must be equal to** `POSTGRES_DB`.
    - Mongo DB:
        - `MONGO_USERNAME`: MongoDB connection username. **Must be equal to** `MONGO_INITDB_ROOT_USERNAME`.
        - `MONGO_PASSWORD`: MongoDB connection password. **Must be equal to** `MONGO_INITDB_ROOT_PASSWORD`.
        - `MONGO_HOST`: MongoDB connection host.
        - `MONGO_PORT`: MongoDB connection port.
        - `MONGO_DB`: MongoDB database where the collections managed in the system will be created.  **Must be equal to** `MONGO_INITDB_DATABASE`.
        - `MONGO_TIMEOUT_MS`: maximum timeout in milliseconds for DB connections. Default `5000` ms.
    - Emailing:
        - `EMAIL_NEW_USER_CONFIRMATION_ENABLED`: set the string `true` to send an email with a confirmation token when a user is created from the Sign-Up panel. Default `false`.
        - `EMAIL_SERVER`: **Only if `EMAIL_NEW_USER_CONFIRMATION_ENABLED` is set to `true`**. SMTP server address to send mails.
        - `EMAIL_PORT`: **Only if `EMAIL_NEW_USER_CONFIRMATION_ENABLED` is set to `true`**. SMTP server port to send mails.
        - `EMAIL_ADDRESS`: **Only if `EMAIL_NEW_USER_CONFIRMATION_ENABLED` is set to `true`**. Email user of the account with which the e-mails will be sent.
        - `EMAIL_FROM_ADDRESS`: **Only if `EMAIL_NEW_USER_CONFIRMATION_ENABLED` is set to `true`**. Alias with which the sender of the mail will appear.
        - `EMAIL_PASSWORD`: **Only if `EMAIL_NEW_USER_CONFIRMATION_ENABLED` is set to `true`**. The password of the mail user with which the mails will be sent.
        - `EMAIL_MAIL_SUBJECT`: **Only if `EMAIL_NEW_USER_CONFIRMATION_ENABLED` is set to `true`**. Title with which the confirmation emails will be sent. By default `Confirm your email`.
    - Modulector:
        - `MODULECTOR_HOST`: Modulector connection host. Default `127.0.0.1`.
        - `MODULECTOR_PORT`: Modulector connection port. Default `8001`.
    - BioAPI:
        - `BIOAPI_HOST`: BioAPI connection host. Default `127.0.0.1`.
        - `BIOAPI_PORT`: BioAPI connection port. Default `8002`.
    - Experiment result table:
        - `TABLE_PAGE_SIZE`: number per rows to display in the table by default. Default `10`.
    - Redis server for WebSocket connections:
        - `REDIS_HOST`: IP of the Redis server, if Docker is used it should be the name of the service since Docker has its own DNS and can resolve it. The default is `redis` which is the name of the service.
        - `REDIS_PORT`: Redis server port. Default `6379`.
3. Return to the root folder of the project and start up all services with:
    - [Docker Compose](https://docs.docker.com/compose/):
        - Start: `docker-compose up -d`. The application will be accessible from the address `127.0.0.1`.
        - Stop: `docker-compose down`.
    - [Docker Swarm][docker-swarm] (For clusters. See the section below to see how to configure one): 
        - Start: `docker stack deploy --compose-file docker-compose.yml multiomix`.
        - Stop: `docker stack rm multiomix`.
4. (Optional) Create a superuser to be able to access the admin panel (`<URL:port>/admin`).
    1. Log in to the container: `docker container exec -it multiomix_backend bash`.
    2. Run: `python3 manage.py createsuperuser`
    3. Exit the container with `exit`
5. (Optional) Optimize PostgreSQL by changing the settings in the `config/postgres/postgres.conf` file. A good place to calculate parameters from machine performance is [PTune](https://pgtune.leopard.in.ua/#/). The `postgres_dist.conf` file is the template that comes in the container by default, it is left to have the template and the official structure.
**Important:** in case you change the parameters, do not forget to put the `listen_addresses = '*'` statement, otherwise it will not work because the rest of the containers will not be able to access it (more info in [the official Docker image page](https://hub.docker.com/_/postgres)).
6. (Optional) Optimize Mongo by changing the configuration in the `config/mongo/mongod.conf` file.


## Cluster configuration

To manage a cluster, [Docker Swarm][docker-swarm] is used. The steps to follow are:

1. Start the cluster: `docker swarm init`.
2. Generate a token for the workers to join ([official doc](https://docs.docker.com/engine/swarm/join-nodes/)): `docker swarm join-token worker`. It will print on screen a token in a command that must be executed in all the workers to be added.
3. Run the command generated in the previous step: `docker swarm join --token <token generated> <HOST>:<PORT>`.
   

## Enable SSL/HTTPS

To enable HTTPS, follow the steps below:

1. Set the `ENABLE_SECURITY` parameter to `true` as explained in the [Instructions](#instructions) section.
2. Copy the file `config/nginx/multiomics_intermediate_safe_dist.conf` and paste it into `config/nginx/conf.d/` with the name `multiomics_intermediate.conf`.
3. Get the `.crt` and `.pem` files for both the certificate and the private key and put them in the `config/nginx/certificates` folder.
4. Edit the `multiomics_intermediate.conf` file that we pasted in point 2. Uncomment the lines where both `.crt` and `.pem` files must be specified.
5. Edit the `docker-compose.yml` file so that the `nginx` service exposes both port 8000 and 443. Also, you need to add `certificates` folder to `volumes` section. It should look something like this:
   ```yaml
   # ...
   nginx:
       image: nginx:1.19.3
       ports:
           - 80:8000
           - 443:443
       # ...
       volumes:
           # ...
           - ./config/nginx/certificates:/etc/nginx/certificates
   # ...
   ```
6. Redo the deployment with Docker.


### Complete security rules checklist

Django provides in its official documentation a configuration checklist that must be present in the production `settings_prod.py` file. To verify that every security rule complies, you could run the following command **once the server is already up (this is because several environment variables are required to be set in the `docker-compose.yml`)**.

`docker container exec multiomics_backend python3 manage.py check --deploy --settings multiomics_intermediate.settings_prod`.

Otherwise, you could set all the mandatory variables found in `settings_prod.py` (such as `REDIS_HOST`) and run them directly without the need to raise any services:

`python3 manage.py check --deploy --settings multiomics_intermediate.settings_prod`.


**IMPORTANT:** note that as Multiomix is deployed in Docker there are some parameters like `SECURE_SSL_REDIRECT` that are not required as the solution is provided by the NGINX service. Probably the above commands will throw warnings that are covered and do not represent a problem.


## Modulector and BioAPI integration

To integrate with [Modulector][modulector] and/or [BioAPI][bioapi] using `docker-compose.yml` files in the same host:

1. Create a common network with the `overlay` driver: `docker network create --driver overlay --attachable multiomix-network`.
2. Add the following block to the end of the Multiomix, Modulector and BioAPI `docker-compose.yml` files:
   ```yaml
   networks:
       default:
           external:
               name: 'multiomix-network'
   ```
3. Change the Modulector and BioAPI configuration so that it does not conflict with the Multiomix configuration:
   1. Rename all the services in the Modulector and BioAPI `docker-compose.yml` files with the suffix `_modulector` and `_bioapi`. **NOTE:** do not forget to rename the `depends_on` parameters, and the database connection parameters to point to the new services names.
   2. Change the following block in the NGINX configuration files. In Modulector it's `config/nginx/conf.d/modulector.conf`, in BioAPI it's `/nginx/conf.d/default.conf`:
   ```
   # Old
   # upstream web {
   #   ip_hash;
   #   server web:8000;
   # }
   
   # New
   upstream web {
     ip_hash;
     server web_modulector:8000; # Or web_bioapi, dependening on which config file you're 
   }
   ```
4. Set Multiomix parameters:
   - `MODULECTOR_HOST` to `nginx_modulector`
   - `MODULECTOR_PORT` to `8000`
   - `BIOAPI_HOST` to `nginx_bioapi`
   - `BIOAPI_PORT` to `8000`
5. Redo the deployment with Docker.


## Creating Dumps and Restoring from Dumps


### Export Postgres

In order to create a database dump you can execute the following command:

`docker exec -t [name of DB container] pg_dump [db name] --data-only | gzip > multiomix_postgres_backup.sql.gz`

That command will create a compressed file with the database dump inside. **Note** that `--data-only` flag is present as DB structure is managed by Django Migrations, so they are not necessary.


### Import Postgres

1. **Optional but recommended**: due to major changes, it's probably that an import thrown several errors when importing. To prevent that you could do the following steps before doing the importation:
    1. Drop all the tables from the DB:
        1. Log into docker container: `docker container exec -it [name of DB container] bash`
        2. Log into Postgres: `psql -U [username] -d [database]`
        3. Run to generate a `DELETE CASCADE` query for all
           tables: `select 'drop table if exists "' || tablename || '" cascade;' from pg_tables where schemaname = 'public';`
        4. (**Danger, will drop tables**) Run the generated query in previous step to drop all tables
    2. Run the Django migrations to create the empty tables with the correct structure: `docker exec -i [name of django container] python3 manage.py migrate`
2. Restore the db running:

`zcat multiomix_postgres_backup.sql.gz | docker exec -i [name of DB container] psql [db name]`

That command will restore the database using a compressed dump as source


### Export MongoDB

In order to create a database dump you can execute the following command **inside the container**:

`mongodump --username [username] --password [password] --authenticationDatabase admin -d multiomics --gzip --archive='multiomix_mongo_backup.txt.gz'`


### Import MongoDB

1. Restore the db running the following commando **inside the container**:

`mongorestore --username [username] --password [password] --authenticationDatabase admin --nsFrom 'multiomics.*' --nsTo '[target DB name].*' --archive='multiomix_mongo_backup.txt.gz' --gzip`

That command will restore the database using a compressed dump as source. You can use the flags `--numInsertionWorkersPerCollection [number of workers]` to increase importing speed or `-vvvv` to check importing status.

[docker-swarm]: https://docs.docker.com/engine/swarm/
[modulector]: https://github.com/omics-datascience/modulector
[bioapi]: https://github.com/omics-datascience/BioAPI
