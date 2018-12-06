# Home server

Home server backend and frontend. The backend is built with Django and the frontend with Vue.js. They are brought together with Docker.

![](http://nicolasbouliane.com/files/homeserver/covers.png)

## What does it do?

### Manage torrent downloads

Start, manage and monitor torrents using the Transmission web client. When the downloads finish, they appear in the *Triage* page, and can be added to the library.

![](http://nicolasbouliane.com/files/homeserver/torrents.png)

### Triage downloaded movies and TV shows

Assign video files and subtitles to movies or TV shows. Information about the movie or TV show is retrieved from The Movie Database and saved locally.  The video, cover and subtitles are copied (hardlinked) to the library with properly formatted names.

![](http://nicolasbouliane.com/files/homeserver/triage-title.png)
![](http://nicolasbouliane.com/files/homeserver/triage-finished.png)

### Convert videos and subtitles

After movies are triaged, a background job extracts the subtitles from the media file and converts the video for streaming to web browsers, mobile devices, Chromecast and Apple TV.

The converted video is smaller, so it can be streamed on slower internet connections. It can be played on almost all devices. The subtitles are converted to .srt and .vtt files, two universal subtitle formats.

The original high resolution video is kept and can be downloaded from the web interface.

![](http://nicolasbouliane.com/files/homeserver/triaged-files.png)

### Stream movies

The movie library can be browsed using from any web browser, including on mobile devices. Movies can be played in the browser, downloaded and watched offline, or sent to a Chromecast device.

Recently added movies are shown first. Recently seen movies are shown last. If you stop watching a movie and resume it later, it will resume at that position later. Subtitles are enabled in the browser and on the Chromecast.

![](http://nicolasbouliane.com/files/homeserver/home.png)
![](http://nicolasbouliane.com/files/homeserver/description.png)
![](http://nicolasbouliane.com/files/homeserver/play-in-browser.png)
![](http://nicolasbouliane.com/files/homeserver/seasons.png)
![](http://nicolasbouliane.com/files/homeserver/mobile-covers.png) ![](http://nicolasbouliane.com/files/homeserver/mobile-video.png)

## Setup

1. Run `scripts/setup.sh` to setup the project. It will ask a few questions and create a config file for you.
2. Run `scripts/start.sh` to start all the components.
3. If necessary, run `scripts/create-user.sh` to create your first user.

### Environment variables

These environment variables are used by the project. Some of these are set automatically when you run `script/setup.sh`.

* `BACKEND_SECRET_KEY`: A random string used by Django. Keep this secret.
* `BACKEND_DEBUG`: '1'. Any other value sets debugging to false.
* `DB_PERSISTENCE_PATH`: A folder to persist the database data.
* `COMMERZBANK_ACCOUNT_NUMBER`: Commerzbank login number.
* `COMMERZBANK_PASSWORD`: Commerzbank login password.
* `N26_USERNAME`
* `N26_PASSWORD`
* `DEGIRO_USERNAME`
* `DEGIRO_PASSWORD`
* `TRANSMISSION_DATA_PATH`: Local path that will be mounted as Transmission's data folder (for incomplete torrents, settings etc)
* `MOVIE_LIBRARY_PATH`: The directory where the completed torrents awaiting triage and the organized movies, covers and subtitles are stored.
* OpenVPN configuration for [the Transmission/OpenVPN image](https://hub.docker.com/r/haugene/transmission-openvpn/):
    * `OPENVPN_PROVIDER`: See documentation for `haugene/transmission-openvpn`
    * `OPENVPN_USERNAME`
    * `OPENVPN_PASSWORD`