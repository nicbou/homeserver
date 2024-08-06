#!/usr/bin/env python
from datetime import datetime
from decimal import Decimal
from pathlib import Path
import gpxpy
import json
import logging
import os
import paho.mqtt.client as mqtt
import pytz


logging.basicConfig(**{
    'datefmt': '%Y-%m-%d %H:%M:%S',
    'format': '[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s',
    'level': logging.INFO,
})
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

gpx_dir = Path('/var/log/gps')


def log_position(
    time: datetime,
    latitude: Decimal,
    longitude: Decimal,
    elevation: int,
    accuracy: int,  # Available but unused
    source: str,
):
    point = gpxpy.gpx.GPXTrackPoint(
        latitude=latitude,
        longitude=longitude,
        elevation=elevation,
        time=time,
    )
    point.source = source

    gpx_path = (gpx_dir / time.strftime("%Y-%m-%d")).with_suffix('.gpx')

    # Create or append
    try:
        with gpx_path.open('r') as gpx_file:
            gpx = gpxpy.parse(gpx_file)
    except:
        gpx = gpxpy.gpx.GPX()
        gpx.tracks.append(gpxpy.gpx.GPXTrack())
        gpx.tracks[-1].segments.append(gpxpy.gpx.GPXTrackSegment())

    gpx.tracks[-1].segments[-1].points.append(point)

    with gpx_path.open('w') as gpx_file:
        gpx_file.write(gpx.to_xml())


def on_connect(client, userdata, flags, rc):
    client.subscribe("+/+/#")
    logger.info(f'MQTT client is connected and listening for messages. Return code was {rc}')


def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload)
        if data['_type'] == 'location':
            log_position(
                time=datetime.fromtimestamp(data['tst'], pytz.UTC),
                latitude=Decimal(data['lat']),
                longitude=Decimal(data['lon']),
                elevation=data.get('alt'),
                accuracy=data.get('acc'),
                source=msg.topic,
            )
    except:
        logger.exception(f"Cannot process message: {msg.payload}")


mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.username_pw_set(os.environ['GPS_LOGGER_USERNAME'], os.environ['GPS_LOGGER_PASSWORD'])
mqtt_client.connect("localhost", 1883, 30)
mqtt_client.loop_forever()
