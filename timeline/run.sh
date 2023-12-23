#!/bin/bash
while true; do
    timeline \
        --url "https://timeline.nicolasbouliane.com" \
        --maps-key "$GOOGLE_MAPS_API_KEY" \
        --include /media/timeline \
        --output /var/timeline/output
    sleep 1800
done
