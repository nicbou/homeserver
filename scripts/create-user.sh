#!/bin/bash
echo "Configuring general server admin account"
docker-compose exec backend python3 manage.py createsuperuser

echo "Configuring pihole admin password"
docker-compose exec pihole sudo pihole -a -p