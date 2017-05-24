FROM ubuntu:16.04
MAINTAINER Nicolas Bouliane

# Update the default application repository sources list
RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y python python-pip

# Set env variables used in this Dockerfile (add a unique prefix, such as DOCKYARD)
# Local directory with project source
ENV DOCKYARD_SRC=code
ENV DOCKYARD_SRVHOME=/srv
ENV DOCKYARD_SRVPROJ=/srv/code

# Create application subdirectories
WORKDIR $DOCKYARD_SRVHOME
RUN mkdir media static logs
VOLUME ["$DOCKYARD_SRVHOME/media/", "$DOCKYARD_SRVHOME/logs/"]

# Install Python dependencies
COPY requirements.txt $DOCKYARD_SRVHOME/requirements.txt
RUN pip install -r $DOCKYARD_SRVHOME/requirements.txt

# Copy application source code to SRCDIR
COPY $DOCKYARD_SRC $DOCKYARD_SRVPROJ

# Port to expose
EXPOSE 80

# Copy entrypoint script into the image
WORKDIR $DOCKYARD_SRVPROJ
COPY ./docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]