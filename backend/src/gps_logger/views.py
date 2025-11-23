from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from pathlib import Path
import gpxpy
import json
import logging


logger = logging.getLogger(__name__)


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

    gpx_path = Path(settings.GPX_LOGS_PATH) / f"{time.strftime('%Y-%m-%d')}.gpx"

    # Create or append
    try:
        with gpx_path.open("r") as gpx_file:
            gpx = gpxpy.parse(gpx_file)
    except:
        gpx = gpxpy.gpx.GPX()
        gpx.tracks.append(gpxpy.gpx.GPXTrack())
        gpx.tracks[-1].segments.append(gpxpy.gpx.GPXTrackSegment())

    gpx.tracks[-1].segments[-1].points.append(point)

    with gpx_path.open("w") as gpx_file:
        gpx_file.write(gpx.to_xml())


class GpsLoggerView(View):
    """
    Receives HTTP pings from OwnTracks
    """

    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            if data["_type"] == "location":
                log_position(
                    time=datetime.utcfromtimestamp(data["tst"]),
                    latitude=Decimal(data["lat"]),
                    longitude=Decimal(data["lon"]),
                    elevation=data.get("alt"),
                    accuracy=data.get("acc"),
                    source=data.get("topic", ""),
                )
            return JsonResponse({"status": "ok"})
        except json.JSONDecodeError:
            return JsonResponse({"status": "failure", "message": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.exception("Error while logging geolocation")
            return JsonResponse({"status": "failure", "message": str(e)}, status=500)
