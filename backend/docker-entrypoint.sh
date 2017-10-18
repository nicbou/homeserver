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
touch /srv/logs/cron.log
tail -n 0 -f /srv/logs/*.log &
service rsyslog start

# Activate cron with all Django environment variables
> /srv/cronenv
echo "export BACKEND_SECRET_KEY=\"${BACKEND_SECRET_KEY}\"" >> /srv/cronenv
echo "export BACKEND_DEBUG=\"${BACKEND_DEBUG}\"" >> /srv/cronenv
echo "export DB_PERSISTENCE_PATH=\"${DB_PERSISTENCE_PATH}\"" >> /srv/cronenv
echo "export COMMERZBANK_ACCOUNT_NUMBER=\"${COMMERZBANK_ACCOUNT_NUMBER}\"" >> /srv/cronenv
echo "export COMMERZBANK_PASSWORD=\"${COMMERZBANK_PASSWORD}\"" >> /srv/cronenv
echo "export N26_USERNAME=\"${N26_USERNAME}\"" >> /srv/cronenv
echo "export N26_PASSWORD=\"${N26_PASSWORD}\"" >> /srv/cronenv
echo "export BACKEND_FIXTURES_PATH=\"${BACKEND_FIXTURES_PATH}\"" >> /srv/cronenv
crontab /srv/crontab
service cron start

# Make sure the data directories exist
mkdir -p /movies
mkdir -p /triage

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