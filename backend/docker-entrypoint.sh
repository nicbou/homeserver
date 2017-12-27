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
printf "export BACKEND_SECRET_KEY=\$'%q'\n" "${BACKEND_SECRET_KEY}" >> /srv/cronenv
printf "export DB_PERSISTENCE_PATH=\$'%q'\n" "${DB_PERSISTENCE_PATH}" >> /srv/cronenv
printf "export COMMERZBANK_ACCOUNT_NUMBER=\$'%q'\n" "${COMMERZBANK_ACCOUNT_NUMBER}" >> /srv/cronenv
printf "export COMMERZBANK_PASSWORD=\$'%q'\n" "${COMMERZBANK_PASSWORD}" >> /srv/cronenv
printf "export N26_USERNAME=\$'%q'\n" "${N26_USERNAME}" >> /srv/cronenv
printf "export N26_PASSWORD=\$'%q'\n" "${N26_PASSWORD}" >> /srv/cronenv
printf "export DEGIRO_USERNAME=\$'%q'\n" "${DEGIRO_USERNAME}" >> /srv/cronenv
printf "export DEGIRO_PASSWORD=\$'%q'\n" "${DEGIRO_PASSWORD}" >> /srv/cronenv
printf "export BACKEND_FIXTURES_PATH=\$'%q'\n" "${BACKEND_FIXTURES_PATH}" >> /srv/cronenv

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

