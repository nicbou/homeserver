#!/bin/bash
while true; do
    timeline \
        --url "/timeline" \
        --maps-key "$GOOGLE_MAPS_API_KEY" \
        --output /var/timeline/output \
        --exclude .git/* \
        --exclude .trashed* \
        --exclude Settings/* \
        --exclude Documents/Manuals/* \
        --exclude Documents/Projects/* \
	/media/timeline
    sleep 1800
done
