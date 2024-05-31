<img align="right" src="kubernetes.svg" alt="Multiomix logo">

# Multiomix in vanilla kubernetes

In this folder you will find the objects templates for deploy multiomix inside an standard `kubernetes` (a.k.a `k8s`) cluster. We recommend you to subscribe to this document and get new features and changes update.


## Why is this vanilla?

To keep the project the more open possible and not force any user to use any paid technology or solution, we stick all our templates to being compatible with any free or open implementation of kubernetes.

The most used solution for kubernetes cluster creation and administration are compatible:

- kind
- kubeadm
- minikube

## Templates

Each of the templates has a service to expose each application inside the `k8s` cluster. You need to define your namespace for the resources under `metadata` section or remove it to apply the default one for your user's context.

### Mongo DB (mongo.yaml)

The `mongo` DB template uses `mongo` as selector and has the following:

- **Deployment**

    The deployment will use the `mongo:4.2` image from docker hub exposing the standard port `TCP 27017` with name `mongo`. The number of replicas for this deployment is one. Please, take in consideration that `mongo` doesn't use shared files between instance, so, in case you need to scalate you will need to define a cluster.
You can also change the main `environment` variables or add new ones that are valid for `mongo:4.2` docker image. You can find more information about the image in [here](https://hub.docker.com/_/mongo).

- **Service**

    We define a `NodePort` service for exposing the previous deployment that will use same listen and target port referenced by name and number (`TPC 27017 mongo`).

### Redis (redis.yaml)

The `redis` template uses `redis` as selector and has the following:

- **Deployment**

    The deployment will use the `redis:6.0.8` image from docker hub exposing the standard port `TCP 6379` without name.     The number of replicas for this deployment is one but can be incremented with out trouble.
We didn't set any special environment variables but you can add them if they are valid for `redis:6.0.8` docker image. You can find more information about the image in [here](https://hub.docker.com/_/redis).

- **Service**

    We define a `NodePort` service for exposing the previous deployment that will use same listen and target port referenced number (`TPC 27017`).

### Multiomix DB (multiomix-db.yaml)

The `multiomix-db` template is only a service without selector, this means that this service will **NOT** discover any other resource inside the `kubernetes` cluster and create the endpoint automatically. To make it usable we set manually the endpoint with the actual IP address of the postgres services. For more info about service without selectors take a look in [here](https://kubernetes.io/docs/concepts/services-networking/service/#without-selectors).

- **Service**

    We define a service for exposing the postgres service inside k8s that will use the port (`TPC 5432 postgres`).

- **Endpoint**

    After the creation of the service we define the endpoint creation with the IP address of the desired postgres service to be used.

It's important know that it's possible to use expose an external URL in a `service` if this is defined like `ExternalName` type. Doing this, the service don't need an `endpoint`. An example of this can be found in `multiomix-db-external-url.yaml` file.

### Multiomix (multiomix.yaml)

The `multiomix` template is the most complex one because we are creating extra resources to protect the secret key and take off the nginx's configuration outside of the pod. It's also complex because, in the main deployment we set two containers.

- **Secret**

    We define an `Opaque` secret to save in there the secret-key that we are going to use for our deployment. Remember that the encryption of secrets inside `kubernetes` is only available if it is set in the cluster. You can have more information about `secrets` in [here](https://kubernetes.io/docs/concepts/configuration/secret/)

- **ConfigMap**

    The configuration for nginx lives in a `ConfigMap` object in `kubernetes`. This mean that we don't need to make changes to `multiomix` image to set it or to the deployment definition. We only reference this `configMap` in the deployment and in case we change it, we only need to roll a new version of the deployment and will take the configuration changes.

- **Deployment**

    This deployment has two containers inside, one using `nginx` and the other one using `multiomix`. In the specification we define that the pod's template will use three volumes: static data, media data and config.
    We use the static and media data volumes inside `multiomix` container and the config inside `nginx`. Besides the volumes we define the mandatory/needed environment variables and expose two ports, the `TCP 8000` for `multiomix` container and the `TCP 8080` for `nginx`. This last one is the one that the service will use.
    We also reference the secret key in an environment variable pointing to the actual `kubernetes` secret that we'd  created before.
    And for last, we have a reference to the `ConfigMap` that allocates the `nginx` configuration inside the `nginx` container definition.

- **Service**

    We define a `NodePort` service for exposing the previous deployment that will use same listen and target port referenced number (`TPC 8080 multiomix-nginx`).

- **Ingress**

    Because the main goal is have a `multiomix` application working for the users, if we don't expose our `service`, this will be only available from inside the cluster. So, for exposing it, we create an ingress in which we set the url  that this will be resolving in the entry point to the cluster.
    The ingress class is out of the scope of this document, but because we try to keep evertyhing free and open, we are using an `nginx` ingressClass because we define an `nginx` ingress controller. To know more about defining an ingress controller inside your cluster you can take a look at [this](https://kubernetes.github.io/ingress-nginx/deploy/).

### Workers (multiomix-*-workers.yaml)

The worker are deployments that run pods with multiomix-celery image. They depend on the following:
- Postgres DB
- Mongo DB
- Shared volume /src/media (This is not described in the templates because we focus in vanilla k8s)