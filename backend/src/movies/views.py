# -*- coding: utf-8 -*-
from .models import Episode, EpisodeWatchStatus, StarredMovie
from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.db import transaction
from django.http import JsonResponse
from django.views import View
from pathlib import Path
from typing import List
import datetime
import json
import logging
import requests


logger = logging.getLogger(__name__)


class MovieListView(View):
    def get(self, request, *args, **kwargs):
        """
        Return all movies/shows and their episodes as a nested list
        """
        movies_by_tmdb_id = {}

        watch_statuses = {wp.episode_id: wp for wp in EpisodeWatchStatus.objects.filter(user=request.user)}
        starred_movies = {s.tmdb_id: s for s in StarredMovie.objects.filter(user=request.user)}

        for movie in Episode.objects.all():
            if not movies_by_tmdb_id.get(movie.tmdb_id):
                movies_by_tmdb_id[movie.tmdb_id] = []
            movies_by_tmdb_id[movie.tmdb_id].append(movie)

        json_movies = []
        for tmdb_id, movies in movies_by_tmdb_id.items():
            json_movie = {
                "tmdbId": tmdb_id,
                "mediaType": movies[0].media_type,
                "title": movies[0].title,
                "description": movies[0].description,
                "coverUrl": movies[0].cover_url,
                "episodes": [],
                "isStarred": tmdb_id in starred_movies,
            }

            for movie in movies:
                watch_status = watch_statuses.get(movie.pk)
                json_movie["episodes"].append(
                    {
                        "conversionStatus": movie.conversion_status,
                        "dateAdded": movie.date_added,
                        "duration": movie.duration,
                        "id": movie.id,
                        "lastWatched": watch_status.last_watched if watch_status else None,
                        "largeVideoUrl": movie.large_video_url,
                        "season": movie.season,
                        "episode": movie.episode,
                        "progress": watch_status.stopped_at if watch_status else 0,
                        "releaseYear": movie.release_year,
                        "hasLargeVersion": movie.large_video_path.exists(),
                    }
                )

            json_movies.append(json_movie)

        return JsonResponse({"movies": json_movies})

    def post(self, request, *args, **kwargs):
        """
        Create or update a movie/show with a list of episodes.
        """
        if not request.user.has_perm("authentication.movies_manage"):
            return JsonResponse(
                {"result": "failure", "message": "You do not have the permission to access this feature"}, status=403
            )

        payload = json.loads(request.body)

        with transaction.atomic():
            # Create the episodes
            episodes: List[Episode] = []
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
                    episode.original_path.unlink(missing_ok=True)
                    episode.original_path.hardlink_to(episode.triage_path)
                    episode.small_video_path.unlink(missing_ok=True)
                    episode.large_video_path.unlink(missing_ok=True)
                    episode.save()

                # Create hard link to subtitle files in the movie library
                for json_language, sub_language in (("En", "eng"), ("De", "ger"), ("Fr", "fre")):
                    if not triage_options.get(f"subtitlesFile{json_language}"):
                        continue

                    subtitles_triage_path = settings.TRIAGE_PATH / triage_options[f"subtitlesFile{json_language}"]
                    assert subtitles_triage_path.exists()

                    subtitles_original_path: Path = episode.subtitles_path(".srt", sub_language)
                    logger.info(f'Copying subtitles "{str(subtitles_triage_path)}" to "{str(subtitles_original_path)}"')
                    subtitles_original_path.unlink(missing_ok=True)
                    subtitles_original_path.hardlink_to(subtitles_triage_path)

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


class DeleteLargeVideoView(PermissionRequiredMixin, View):
    permission_required = "authentication.movies_manage"

    def delete(self, request, *args, **kwargs):
        """
        Delete the large version of the video and replace it with a hard link to the small one
        """
        episode_id = kwargs.get("id")
        try:
            episode = Episode.objects.get(pk=episode_id)
            episode.large_video_path.unlink(missing_ok=True)
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
                {"result": "failure", "message": "You do not have the permission to access this feature"}, status=403
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
        files_in_triage_dir = list(settings.TRIAGE_PATH.rglob("*"))
        videos_in_triage_dir = set(f for f in files_in_triage_dir if f.suffix.lower() in settings.VIDEO_EXTENSIONS)
        triaged_paths = set(Path(f) for f in Episode.objects.values_list("triage_path", flat=True))
        untriaged_videos = videos_in_triage_dir.difference(triaged_paths)

        subtitles_in_triage_dir = [
            str(f.relative_to(settings.TRIAGE_PATH))
            for f in files_in_triage_dir
            if f.suffix.lower() in settings.SUBTITLE_EXTENSIONS
        ]

        return JsonResponse(
            {
                "movies": [str(f.relative_to(settings.TRIAGE_PATH)) for f in untriaged_videos],
                "subtitles": subtitles_in_triage_dir,
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
                {"result": "failure", "message": "`progress` is missing from request payload"}, status=400
            )
        except ValueError:
            return JsonResponse({"result": "failure", "message": "`progress` must be an integer"}, status=400)
        return JsonResponse({"result": "success"})
