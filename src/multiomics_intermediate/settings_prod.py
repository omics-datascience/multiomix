from .settings import *
import os

# You can set the SECRET_KEY with an env var or a file generated automatically
secret_key_env = os.getenv('SECRET_KEY')
if secret_key_env is None:
    # Use a separate file for the secret key. Generated with https://pypi.org/project/django-generate-secret-key/
    with open(os.path.join(BASE_DIR, 'secretkey.txt')) as f:
        SECRET_KEY = f.read().strip()
else:
    # Use env var
    SECRET_KEY = secret_key_env

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# 'web' is the name of the docker-compose service which serves Django
ALLOWED_HOSTS = ['web']

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(os.environ['REDIS_HOST'], os.environ['REDIS_PORT'])],
        },
    },
}

# +++++ Custom settings +++++

# MongoDB credentials (should be setted as ENV vars)
MONGO_SETTINGS = {
    'username': os.environ['MONGO_USERNAME'],
    'password': os.environ['MONGO_PASSWORD'],
    'host': os.environ['MONGO_HOST'],
    'port': os.environ['MONGO_PORT'],
    'db': os.environ['MONGO_DB'],  # Default DB to use to manage the MongoDB collections
    'timeout': os.getenv('MONGO_TIMEOUT_MS', 5000)  # Connection timeout
}
