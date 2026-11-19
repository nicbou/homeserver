FROM ubuntu:26.10

# mediainfo: To check if videos are streamable
COPY requirements.txt /requirements.txt
RUN apt-get update && apt-get -y upgrade && apt-get install -y \
    cron \
    ffmpeg \
    python3 \
    python3-pip \
    mediainfo \
    && pip3 install --no-cache-dir --break-system-packages -r /requirements.txt \
    && mkdir -p /var/log/backend

COPY ./crontab.conf ./docker-entrypoint.sh /var/backend/
WORKDIR /var/backend/src
ENTRYPOINT ["/var/backend/docker-entrypoint.sh"]