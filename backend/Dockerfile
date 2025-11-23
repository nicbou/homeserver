FROM ubuntu:25.10
MAINTAINER Nicolas Bouliane

# mediainfo: To check if videos are streamable
# netcat: To wait for database to be available when starting the backend
COPY requirements.txt /requirements.txt
RUN apt-get update && apt-get -y upgrade && apt-get install -y \
    ffmpeg \
    libpq-dev \
    python3 \
    python3-dev \
    python3-pip \
    mediainfo \
    git \
    wget \
    && pip3 install --no-cache-dir --break-system-packages -r /requirements.txt \
    && mkdir -p /var/log/backend

# Copy entrypoint script into the image
WORKDIR /var/backend/src
COPY ./docker-entrypoint.sh /var/backend/docker-entrypoint.sh
ENTRYPOINT ["/var/backend/docker-entrypoint.sh"]