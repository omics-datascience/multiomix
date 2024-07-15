#!/bin/bash

# This script exports media volume (multiomics_intermediate_media_data) to a .tar.gz file in the media_backups folder.
docker container run --rm -it -v multiomics_intermediate_media_data:/from -v ./media_backups:/to alpine ash -c "cd /from; tar czvf /to/\"media-backup_$(date '+%Y-%m-%d_%H-%M-%S').tar.gz\" ."