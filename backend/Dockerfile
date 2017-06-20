FROM ubuntu:16.04
MAINTAINER Nicolas Bouliane

# Update the default application repository sources list
RUN apt-get update && apt-get -y upgrade
# libfreetype is for phantomjs
RUN apt-get install -y python python-pip netcat git wget

# PhantomJS
WORKDIR /usr/local/share
RUN wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2 && \
    tar xjf phantomjs-1.9.7-linux-x86_64.tar.bz2 && \
    ln -s /usr/local/share/phantomjs-1.9.7-linux-x86_64/bin/phantomjs /usr/local/share/phantomjs && \
    ln -s /usr/local/share/phantomjs-1.9.7-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs && \
    ln -s /usr/local/share/phantomjs-1.9.7-linux-x86_64/bin/phantomjs /usr/bin/phantomjs
RUN apt-get install -y libfontconfig1-dev libfreetype6

# Set env variables used in this Dockerfile (add a unique prefix, such as DOCKYARD)
# Local directory with project source
ENV DOCKYARD_SRC=src
ENV DOCKYARD_SRVHOME=/srv
ENV DOCKYARD_SRVPROJ=/srv/src

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