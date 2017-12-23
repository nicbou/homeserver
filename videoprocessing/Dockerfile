FROM jrottenberg/ffmpeg:3.3-alpine

RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories

# Install Python 3 for the API, mkvtoolnix for mkv subtitles, lxml for vtt subtitles
RUN apk add --no-cache \
    python3 \
    python3-dev \
    bash \
    mkvtoolnix \
    py-lxml \
  && pip3 install --no-cache-dir --upgrade pip \
  && rm -rf /var/cache/* \
  && rm -rf /root/.cache/*

RUN cd /usr/bin \
  && ln -sf python3 python \
  && ln -sf pip3 pip

# Setup API
COPY requirements.txt /srv/requirements.txt
RUN pip install -r /srv/requirements.txt

COPY src /srv/src
COPY docker-entrypoint.sh /docker-entrypoint.sh
WORKDIR "/srv/src"
ENTRYPOINT ["/docker-entrypoint.sh"]