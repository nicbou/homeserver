#!/bin/bash

# Wait for database
until nc -z db 5432; do echo Waiting for PostgreSQL; sleep 1; done

python manage.py migrate                  # Apply database migrations
python manage.py collectstatic --noinput  # Collect static files

# Prepare log files and start outputting logs to stdout
touch /srv/logs/gunicorn.log
touch /srv/logs/access.log
touch /srv/logs/cron.log
tail -n 0 -f /srv/logs/*.log &
service rsyslog start

# Activate cron with all Django environment variables
> /srv/cronenv
printf "export BACKEND_SECRET_KEY=%q\n" "${BACKEND_SECRET_KEY}" >> /srv/cronenv
printf "export DB_PERSISTENCE_PATH=%q\n" "${DB_PERSISTENCE_PATH}" >> /srv/cronenv

crontab /srv/crontab
service cron start

# Make sure the data directories exist
mkdir -p /movies
mkdir -p /movies/triage
mkdir -p /movies/library

# Start Gunicorn processes
echo Starting Gunicorn.
exec gunicorn backend.wsgi:application \
    --name backend \
    --reload \
    --bind 0.0.0.0:80 \
    --workers 3 \
    --log-level=info \
    --log-file=/srv/logs/gunicorn.log \
    --access-logfile=/srv/logs/access.log \
    "$@"

