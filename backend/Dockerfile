FROM ubuntu:25.10
MAINTAINER Nicolas Bouliane

# mediainfo: To check if videos are streamable
# netcat: To wait for database to be available when starting the backend
RUN apt-get update && apt-get -y upgrade &&  apt-get install -y \
    ffmpeg \
    libpq-dev \
    python3 \
    python3-dev \
    python3-pip \
    mediainfo \
    netcat-traditional \
    git \
    wget \
    && pip3 install --no-cache-dir --break-system-packages \
        Django==5.2.8 \
        gunicorn==23.0.0 \ 
        psycopg2==2.9.11 \
        requests==2.32.5 \
    && mkdir -p /var/log/backend

# Copy entrypoint script into the image
WORKDIR /var/backend/src
COPY ./docker-entrypoint.sh /var/backend/docker-entrypoint.sh
ENTRYPOINT ["/var/backend/docker-entrypoint.sh"]