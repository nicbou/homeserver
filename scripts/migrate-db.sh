#!/bin/bash
docker-compose exec backend python3 manage.py makemigrations && docker-compose exec backend python3 manage.py migrate

