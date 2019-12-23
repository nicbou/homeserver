#!/bin/bash
# Reconverts a movie's subtitles
# Accepts a movie ID as a first argument.
docker-compose exec backend python3 manage.py convert_subtitles $1