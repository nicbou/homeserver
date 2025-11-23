#!/bin/bash

python3 manage.py migrate
python3 manage.py collectstatic --noinput

# Prepare log files and output them to stdout
touch /var/log/backend/gunicorn.log
touch /var/log/backend/access.log
tail -n 0 -f /var/log/backend/*.log &

# Make sure the data directories exist
mkdir -p /movies/triage
mkdir -p /movies/library

# Convert movies in the background
python3 /var/backend/src/manage.py convert_new_movies &

# Start Gunicorn processes
echo Starting Gunicorn.
exec gunicorn backend.wsgi:application \
    --name backend \
    --reload \
    --bind 0.0.0.0:80 \
    --workers 3 \
    --log-level=info \
    --log-file=/var/log/backend/gunicorn.log \
    --access-logfile=/var/log/backend/access.log \
    "$@"
