#!/bin/bash

# Usage: convert.sh input_file output_file
FFMPEG_PATH=/usr/local/bin/ffmpeg
LOG_FILE=/dev/stdout
OUTPUT_PATH=$2
TMP_OUTPUT_PATH="$2.tmp"

set -x

# Start the conversion
# ac - audio channels
# async 1 \
# b:a - audio bitrate (64k per channel)
# b:v - video bitrate
# bufsize - calculate maxrate every x bytes
# codec:a - audio codec
# codec:v - video codec
# i "$1" - inpur
# loglevel warning
# maxrate 1200k - max bitrate
# movflags faststart - allows streaming
# preset medium \
# profile:v high \
# threads 0 \
# vf scale="trunc(oh*a/2)*2:480" \
$FFMPEG_PATH \
    -i "$1" \
    -codec:v libx264 \
    -profile:v high \
    -preset fast \
    -movflags faststart \
    -b:v 900k \
    -maxrate 1200k \
    -b:a 128k \
    -bufsize 1200k \
    -vf scale="trunc(oh*a/2)*2:480" \
    -threads 0 \
    -ac 2 \
    -async 1 \
    -loglevel warning \
    -codec:a libfdk_aac \
    -f mp4 "${TMP_OUTPUT_PATH}"

# Check the exit code
if [ $? -eq 0 ]
then
    rm -f "${OUTPUT_PATH}"  # If it already exists
    mv "${TMP_OUTPUT_PATH}" "${OUTPUT_PATH}"
    echo "Conversion of ${TMP_OUTPUT_PATH} succeeded"
    exit 0
else
    rm -f "${TMP_OUTPUT_PATH}"
    echo "Conversion of ${TMP_OUTPUT_PATH} failed"
    exit 1
fi
