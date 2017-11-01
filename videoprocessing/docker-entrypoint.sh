#!/bin/bash

# Make sure the data directories exist
mkdir -p /movies
mkdir -p /movies/triage

# Start everything
rq worker -u 'redis://redis:6379/1' -P /srv/src &
/srv/src/api.py