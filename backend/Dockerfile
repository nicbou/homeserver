FROM ubuntu:23.10
MAINTAINER Nicolas Bouliane

COPY requirements.txt /var/backend/requirements.txt

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
    && pip3 install --break-system-packages -r /var/backend/requirements.txt \
    && mkdir -p /var/log/backend

# Copy entrypoint script into the image
WORKDIR /var/backend/src
COPY ./docker-entrypoint.sh /var/backend
ENTRYPOINT ["/var/backend/docker-entrypoint.sh"]