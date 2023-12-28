#!/bin/bash

# Wait for database
until nc -z db 5432; do echo Waiting for PostgreSQL; sleep 1; done

python3 manage.py migrate                  # Apply database migrations
python3 manage.py collectstatic --noinput  # Collect static files

# Prepare log files and output them to stdout
touch /var/log/backend/gunicorn.log
touch /var/log/backend/access.log
tail -n 0 -f /var/log/backend/*.log &

# Make sure the data directories exist
mkdir -p /movies
mkdir -p /movies/triage
mkdir -p /movies/library

# Convert movies in the background
python3 /srv/src/manage.py convert_new_movies &

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
