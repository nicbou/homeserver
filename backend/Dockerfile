FROM ubuntu:20.04
MAINTAINER Nicolas Bouliane

# Update the default application repository sources list
RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y \
    libpq-dev \
    python3 \
    python3-dev \
    python3-pip \
    netcat \
    git \
    wget \
    cron

# Set env variables used in this Dockerfile (add a unique prefix, such as DOCKYARD)
# Local directory with project source
ENV DOCKER_SRC=src
ENV DOCKER_SRVHOME=/srv
ENV DOCKER_SRVPROJ=/srv/src

# Create application subdirectories
WORKDIR $DOCKER_SRVHOME
RUN mkdir media static logs
VOLUME ["$DOCKER_SRVHOME/media/", "$DOCKER_SRVHOME/logs/", "$DOCKER_SRVPROJ"]

# Install Python dependencies
COPY requirements.txt $DOCKER_SRVHOME/requirements.txt
RUN pip3 install -r $DOCKER_SRVHOME/requirements.txt

# Set up cron
COPY crontab $DOCKER_SRVHOME/crontab
RUN chmod 600 $DOCKER_SRVHOME/crontab

# Port to expose
EXPOSE 80

# Copy entrypoint script into the image
WORKDIR $DOCKER_SRVPROJ
COPY ./docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]