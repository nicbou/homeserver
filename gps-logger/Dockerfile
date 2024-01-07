FROM eclipse-mosquitto:1.6.15

RUN apk add --update --no-cache \
    python3 py3-pip \
    && ln -sf python3 /usr/bin/python \
    && pip3 install --no-cache-dir \
        gpxpy==1.5.0 \
        paho-mqtt==1.6.1 \
        requests==2.31.0 \
        pytz

COPY . /