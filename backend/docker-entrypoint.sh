#!/bin/bash

# Wait for database
until nc -z db 5432; do echo Waiting for PostgreSQL; sleep 1; done

python manage.py migrate                  # Apply database migrations
python manage.py collectstatic --noinput  # Collect static files

# Load fixtures
FIXTURES_PATH=/fixtures
if [[ ! -z $FIXTURES_PATH ]];
then
    for fixture in ${FIXTURES_PATH}/*.json; do
        filename=`basename "$fixture"`
        python manage.py loaddata /fixtures/${filename}
    done
fi

# Prepare log files and start outputting logs to stdout
touch /srv/logs/gunicorn.log
touch /srv/logs/access.log
tail -n 0 -f /srv/logs/*.log &

# Activate cron
crontab /etc/cron.d/crontab
service cron start

# Start Gunicorn processes
echo Starting Gunicorn.
exec gunicorn backend.wsgi:application \
    --name backend \
    --bind 0.0.0.0:80 \
    --workers 3 \
    --log-level=info \
    --log-file=/srv/logs/gunicorn.log \
    --access-logfile=/srv/logs/access.log \
    "$@"