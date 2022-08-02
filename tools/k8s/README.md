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

### Mongo DB

The `mongo` DB template uses `mongo` as selector and has the following:

- **Deployment**

The deployment will use the `mongo:4.2` image from docker hub exposing the standard port `TCP 27017` with name `mongo`. The number of replicas for this deployment is one. Please, take in consideration that `mongo` doesn't use shared files between instance, so, in case you need to scalate you will need to define a cluster.
You can also change the main `environment` variables or add new ones that are valid for `mongo:4.2` docker image. You can find more information about the image in [here](https://hub.docker.com/_/mongo).

- **Service**

We define a `NodePort` service for exposing the previous deployment that will use same listen and target port referenced by name and number (`TPC 27017 mongo`).

### Redis

The `redis` template uses `redis` as selector and has the following:

- **Deployment**

The deployment will use the `redis:6.0.8` image from docker hub exposing the standard port `TCP 6379` without name. The number of replicas for this deployment is one but can be incremented with out trouble.
We didn't set any special environment variables but you can add them if they are valid for `redis:6.0.8` docker image. You can find more information about the image in [here](https://hub.docker.com/_/redis).

- **Service**

We define a `NodePort` service for exposing the previous deployment that will use same listen and target port referenced number (`TPC 27017`).


