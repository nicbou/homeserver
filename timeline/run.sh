#!/bin/bash
while true; do
    timeline \
        --url "https://timeline.nicolasbouliane.com" \
        --maps-key "$GOOGLE_MAPS_API_KEY" \
        --output /var/timeline/output \
	/media/timeline
    sleep 1800
done
