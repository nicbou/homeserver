#!/bin/bash

# Make sure the data directories exist
mkdir -p /movies
mkdir -p /movies/triage

# Start everything
rq worker subtitles -u $REDIS_DB_URL &
/srv/src/conversion_worker.py &
/srv/src/api.py