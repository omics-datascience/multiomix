# This script imports media files from the src/media folder to the docker volume multiomics_intermediate_media_data.
# This is useful when importing 'media' backup in a new environment.
docker container run --rm -it -v ./src/media:/from -v multiomics_intermediate_media_data:/to alpine ash -c "cd /from ; cp -av . /to"