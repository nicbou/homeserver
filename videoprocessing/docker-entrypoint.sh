#!/bin/bash

# Make sure the data directories exist
mkdir -p /movies
mkdir -p /movies/triage

# Start everything
/srv/src/conversion_worker.py &
/srv/src/api.py