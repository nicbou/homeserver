FROM jrottenberg/ffmpeg:4.1-ubuntu2004

ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install Python 3 for the API, mediainfo to check if videos are streamable
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-pip \
    bash \
    mediainfo \
  && pip3 install --no-cache-dir --upgrade pip

RUN cd /usr/bin \
  && ln -sf python3 python \
  && ln -sf pip3 pip

# Setup API
COPY requirements.txt /srv/requirements.txt
RUN pip3 install -r /srv/requirements.txt

COPY src /srv/src
COPY docker-entrypoint.sh /docker-entrypoint.sh

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

WORKDIR "/srv/src"
ENTRYPOINT ["/docker-entrypoint.sh"]
