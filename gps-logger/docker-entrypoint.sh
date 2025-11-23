#!/bin/bash
set -e

# Set permissions
user="$(id -u)"
if [ "$user" = '0' ]; then
    [ -d "/mosquitto" ] && chown -R mosquitto:mosquitto /mosquitto || true
fi

# Set password
touch /mosquitto/config/mosquitto.passwd
mosquitto_passwd -b /mosquitto/config/mosquitto.passwd "${MQTT_USERNAME}" "${MQTT_PASSWORD}"

# Start mosquitto
echo "$@"
exec "$@" &

sleep 10

# Start logging server in background
/logger.py
