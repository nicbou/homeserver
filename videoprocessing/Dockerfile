FROM jrottenberg/ffmpeg:3.3

# Install Python 3 for the API, mkvtoolnix for mkv subtitles, lxml for vtt subtitles
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-pip \
    bash \
    mkvtoolnix \
    python-lxml \
  && pip3 install --no-cache-dir --upgrade pip

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