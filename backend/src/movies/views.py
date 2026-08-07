import datetime
import json
import logging
from pathlib import Path

import PTN
import requests
from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.db import transaction
from django.http import JsonResponse
from django.views import View

from .models import Episode, EpisodeWatchStatus, IgnoredTriageFile, StarredMovie

logger = logging.getLogger(__name__)


class MovieListView(View):
    def get(self, request, *args, **kwargs):
        """
        Return all movies/shows and their episodes as a nested list
        """
        episodes_by_tmdb_id = {}

        watch_statuses = {wp.episode_id: wp for wp in EpisodeWatchStatus.objects.filter(user=request.user)}
        starred_movies = {s.tmdb_id: s for s in StarredMovie.objects.filter(user=request.user)}

        for episode in Episode.objects.all():
            if not episodes_by_tmdb_id.get(episode.tmdb_id):
                episodes_by_tmdb_id[episode.tmdb_id] = []
            episodes_by_tmdb_id[episode.tmdb_id].append(episode)

        json_movies = []
        for tmdb_id, episodes in episodes_by_tmdb_id.items():
            movie_or_show = {
                "tmdbId": tmdb_id,
                "mediaType": episodes[0].media_type,
                "title": episodes[0].title,
                "description": episodes[0].description,
                "coverUrl": episodes[0].cover_url,
                "episodes": [],
                "isStarred": tmdb_id in starred_movies,
            }

            for episode in episodes:
                watch_status = watch_statuses.get(episode.pk)
                movie_or_show["episodes"].append(
                    {
                        "conversionStatus": episode.conversion_status,
                        "dateAdded": episode.date_added,
                        "duration": episode.duration,
                        "id": episode.id,
                        "lastWatched": watch_status.last_watched if watch_status else None,
                        "originalVideoUrl": episode.original_video_url,
                        "season": episode.season,
                        "episode": episode.episode,
                        "progress": watch_status.stopped_at if watch_status else 0,
                        "releaseYear": episode.release_year,
                        "hasOriginalVersion": episode.original_video_path.exists(),
                        "hasSubtitles": episode.subtitles_path(".vtt", "eng").exists(),
                    }
                )

            json_movies.append(movie_or_show)

        return JsonResponse({"movies": json_movies})

    def post(self, request, *args, **kwargs):
        """
        Create or update a movie/show with a list of episodes.
        """
        if not request.user.has_perm("authentication.movies_manage"):
            return JsonResponse(
                {
                    "result": "failure",
                    "message": "You do not have the permission to access this feature",
                },
                status=403,
            )

        payload = json.loads(request.body)

        with transaction.atomic():
            # Create the episodes
            episodes: list[Episode] = []
            for json_episode in payload.get("episodes", []):
                episode = Episode.objects.get_or_create(
                    tmdb_id=payload.get("tmdbId"),
                    episode=json_episode.get("episode", None),
                    season=json_episode.get("season", None),
                    media_type=payload.get("mediaType", Episode.MOVIE),
                )[0]

                if payload.get("title"):
                    episode.title = payload.get("title")
                if payload.get("description"):
                    episode.description = payload.get("description")
                if "dateAdded" in json_episode:
                    episode.date_added = json_episode.get("dateAdded")

                if "progress" in json_episode or "lastWatched" in json_episode:
                    watch_status = EpisodeWatchStatus.objects.get_or_create(user=request.user, episode=episode)[0]
                    if "progress" in json_episode:
                        watch_status.stopped_at = json_episode.get("progress", 0)
                    if "lastWatched" in json_episode:
                        watch_status.last_watched = json_episode.get("lastWatched")
                    watch_status.save()
                if json_episode.get("releaseYear"):
                    episode.release_year = json_episode.get("releaseYear")

                episodes.append(episode)
                episode.save()

            # Retrieve the (optional) triage options
            triage_options = [
                json_episode.get(
                    "triage",
                    {
                        "movieFile": None,
                        "subtitlesFileEn": None,
                        "subtitlesFileFr": None,
                        "subtitlesFileDe": None,
                    },
                )
                for json_episode in payload.get("episodes", [])
            ]

            # Create hard links to the files in the triage directory so that they can be
            # in the triage directory and in the movie library at the same time.
            # If the movie is already in the library, overwrite the file.
            conversion_queue = []
            for episode, triage_options in zip(episodes, triage_options):
                episode_triage_path = settings.TRIAGE_PATH / Path(triage_options.get("movieFile"))

                # Create hard link to the original video in the movie library
                if episode_triage_path.exists():
                    episode.triage_path = episode_triage_path

                    # If it replaces an existing episode
                    episode.original_video_path.unlink(missing_ok=True)
                    episode.original_video_path.hardlink_to(episode.triage_path)
                    episode.converted_video_path.unlink(missing_ok=True)
                    episode.save()

                # Create hard link to subtitle files in the movie library
                for json_language, sub_language in (
                    ("En", "eng"),
                    ("De", "ger"),
                    ("Fr", "fre"),
                ):
                    if not triage_options.get(f"subtitlesFile{json_language}"):
                        continue

                    subtitles_triage_path = settings.TRIAGE_PATH / triage_options[f"subtitlesFile{json_language}"]
                    assert subtitles_triage_path.exists()

                    subtitles_original_video_path: Path = episode.subtitles_path(".srt", sub_language)
                    logger.info(f'Copying subtitles "{subtitles_triage_path!s}" to "{subtitles_original_video_path!s}"')
                    subtitles_original_video_path.unlink(missing_ok=True)
                    subtitles_original_video_path.hardlink_to(subtitles_triage_path)
                    IgnoredTriageFile.objects.get_or_create(path=str(subtitles_triage_path))

                conversion_queue.append(episode)

            # Download the cover URL if necessary
            new_cover_url = payload.get("coverUrl")
            if new_cover_url and new_cover_url != episodes[0].cover_url:
                self.download_file(new_cover_url, episodes[0].cover_path)

        return JsonResponse({"result": "success"})

    def download_file(self, url: str, filename: Path):
        req = requests.get(url, stream=True)
        if req.status_code == 200:
            with filename.open("wb") as cover_file:
                for chunk in req:
                    cover_file.write(chunk)
        else:
            logger.error(f"Could not download file at {url}.")


class DeleteOriginalVideoView(PermissionRequiredMixin, View):
    permission_required = "authentication.movies_manage"

    def delete(self, request, *args, **kwargs):
        """
        Delete the original version of the video and keep the converted version
        """
        episode_id = kwargs.get("id")
        try:
            episode = Episode.objects.get(pk=episode_id)
            episode.original_video_path.unlink(missing_ok=True)
        except Episode.DoesNotExist:
            message = "Episode does not exist."
            logger.error(f"Failed to replace original of episode #{episode_id}. {message}")
            return JsonResponse({"result": "failure", "message": message}, status=404)
        return JsonResponse({"result": "success"})


class EpisodeView(PermissionRequiredMixin, View):
    permission_required = "authentication.movies_manage"

    def delete(self, request, *args, **kwargs):
        if not request.user.has_perm("authentication.movies_manage"):
            return JsonResponse(
                {
                    "result": "failure",
                    "message": "You do not have the permission to access this feature",
                },
                status=403,
            )

        episode_id = kwargs.get("id")
        try:
            Episode.objects.get(pk=episode_id).delete()
            logger.info(f"Deleted episode #{episode_id}.")
        except Episode.DoesNotExist:
            logger.warning(f"Could not delete episode #{episode_id}. Episode does not exist.")
            return JsonResponse({"result": "failure", "message": "Episode does not exist"}, status=404)
        return JsonResponse({"result": "success"})


class TriageListView(PermissionRequiredMixin, View):
    """
    List of untriaged video and subtitle files
    """

    permission_required = "authentication.movies_manage"

    def get(self, request, *args, **kwargs):
        files_in_triage_dir = set(settings.TRIAGE_PATH.rglob("*"))

        videos_in_triage_dir = {
            f
            for f in files_in_triage_dir
            if f.suffix.lower() in settings.VIDEO_EXTENSIONS and not f.stem.lower().endswith("sample")
        }

        triaged_paths = {
            Path(f) for f in Episode.objects.exclude(triage_path=None).values_list("triage_path", flat=True)
        }

        ignored_paths = {Path(f) for f in IgnoredTriageFile.objects.values_list("path", flat=True)}

        # Remove ignored paths that no longer exist
        stale_ignored_paths = ignored_paths - files_in_triage_dir
        if stale_ignored_paths:
            IgnoredTriageFile.objects.filter(path__in=[str(p) for p in stale_ignored_paths]).delete()

        videos_to_triage = videos_in_triage_dir - triaged_paths - ignored_paths
        ignored_videos = videos_in_triage_dir & ignored_paths

        subtitles_in_triage_dir = [
            str(f.relative_to(settings.TRIAGE_PATH))
            for f in files_in_triage_dir
            if f.suffix.lower() in settings.SUBTITLE_EXTENSIONS and f not in ignored_paths
        ]

        def serialize_triage_item(f, ignored):
            parsed_title = PTN.parse(f.name)
            return {
                "suggestedTitle": parsed_title.get("title"),
                "suggestedSeason": parsed_title.get("season"),
                "suggestedEpisode": parsed_title.get("episode"),
                "path": str(f.relative_to(settings.TRIAGE_PATH)),
                "ignored": ignored,
            }

        return JsonResponse(
            {
                "movies": [serialize_triage_item(f, False) for f in sorted(videos_to_triage)]
                + [serialize_triage_item(f, True) for f in sorted(ignored_videos)],
                "subtitles": sorted(subtitles_in_triage_dir),
            }
        )


class TriageIgnoreView(PermissionRequiredMixin, View):
    """
    Mark a triage file as ignored so it stops appearing in the triage list,
    or un-ignore a previously ignored file.
    """

    permission_required = "authentication.movies_manage"

    def post(self, request, *args, **kwargs):
        payload = json.loads(request.body)
        relative_path = payload.get("path")
        if not relative_path:
            return JsonResponse({"result": "failure", "message": "`path` is required"}, status=400)

        absolute_path = settings.TRIAGE_PATH / Path(relative_path)
        if not absolute_path.exists():
            return JsonResponse({"result": "failure", "message": "File does not exist"}, status=404)

        IgnoredTriageFile.objects.get_or_create(path=str(absolute_path))
        return JsonResponse({"result": "success"})

    def delete(self, request, *args, **kwargs):
        payload = json.loads(request.body)
        relative_path = payload.get("path")
        if not relative_path:
            return JsonResponse({"result": "failure", "message": "`path` is required"}, status=400)

        absolute_path = settings.TRIAGE_PATH / Path(relative_path)
        IgnoredTriageFile.objects.filter(path=str(absolute_path)).delete()
        return JsonResponse({"result": "success"})


class SystemStatsView(PermissionRequiredMixin, View):
    permission_required = "authentication.movies_manage"

    def get(self, request, *args, **kwargs):
        import shutil

        stats = shutil.disk_usage(settings.TRIAGE_PATH)
        return JsonResponse(
            {
                "total": stats.total,
                "used": stats.used,
                "free": stats.free,
            }
        )


class EpisodeWatchedView(View):
    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get("id")
        try:
            episode = Episode.objects.get(pk=episode_id)
            watch_status = EpisodeWatchStatus.objects.get_or_create(user=request.user, episode=episode)[0]
            watch_status.last_watched = datetime.date.today()
            watch_status.save()
        except Episode.DoesNotExist:
            return JsonResponse({"result": "failure", "message": "Episode does not exist"}, status=404)
        return JsonResponse({"result": "success"})


class EpisodeUnwatchedView(View):
    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get("id")
        try:
            episode = Episode.objects.get(pk=episode_id)
            watch_status = EpisodeWatchStatus.objects.get(user=request.user, episode=episode)
            watch_status.delete()
        except EpisodeWatchStatus.DoesNotExist:
            pass
        except Episode.DoesNotExist:
            return JsonResponse({"result": "failure", "message": "Episode does not exist"}, status=404)
        return JsonResponse({"result": "success"})


class EpisodeStarView(View):
    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get("id")
        try:
            episode = Episode.objects.get(pk=episode_id)
            star = StarredMovie.objects.get_or_create(user=request.user, tmdb_id=episode.tmdb_id)[0]
            star.save()
        except Episode.DoesNotExist:
            return JsonResponse({"result": "failure", "message": "Episode does not exist"}, status=404)
        return JsonResponse({"result": "success"})


class EpisodeUnstarView(View):
    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get("id")
        try:
            episode = Episode.objects.get(pk=episode_id)
            StarredMovie.objects.get(user=request.user, tmdb_id=episode.tmdb_id).delete()
        except StarredMovie.DoesNotExist:
            pass
        except Episode.DoesNotExist:
            return JsonResponse({"result": "failure", "message": "Episode does not exist"}, status=404)
        return JsonResponse({"result": "success"})


class EpisodeProgressView(View):
    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get("id")
        payload = json.loads(request.body)
        try:
            episode = Episode.objects.get(pk=episode_id)
            watch_status = EpisodeWatchStatus.objects.get_or_create(user=request.user, episode=episode)[0]
            watch_status.stopped_at = int(payload["progress"])
            watch_status.save()
        except Episode.DoesNotExist:
            return JsonResponse({"result": "failure", "message": "Episode does not exist"}, status=404)
        except KeyError:
            return JsonResponse(
                {
                    "result": "failure",
                    "message": "`progress` is missing from request payload",
                },
                status=400,
            )
        except ValueError:
            return JsonResponse(
                {"result": "failure", "message": "`progress` must be an integer"},
                status=400,
            )
        return JsonResponse({"result": "success"})
