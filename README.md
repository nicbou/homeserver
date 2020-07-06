# Home server

Home server backend and frontend. The backend is built with Django and the frontend with Vue.js. They are brought together with Docker.

![](http://nicolasbouliane.com/files/homeserver/covers.png)

## Setup

1. Put your SSL certificates in `proxy/ssl-certs`. These are expected:
    * `server.key`, the key used to generate your SSL certificate
    * `cert-chain.crt`, created by running `cat server.crt server.ca-bundle >> cert-chain.crt`
2. Run `scripts/setup.sh` to setup the project. It will ask a few questions and create a config file for you.
3. Run `docker-compose up --build -d` to start all the components.
4. If necessary, run `scripts/create-user.sh` to create your first user.

### Environment variables

Put these environment variables in a .env file. These environment variables are used by the project.

* `COMPOSE_PROJECT_NAME`: A unique value for this project, to avoid docker container and volume conflicts.
* `DIGITALOCEAN_TOKEN`: API token used to update dynamic DNS
* `NEXTCLOUD_FILES_PATH`: Where your Nextcloud files are stored
* `BACKEND_SECRET_KEY`: A random string used by Django. Keep this secret.
* `BACKEND_DEBUG`: '1'. Any other value sets debugging to false.
* `TRANSMISSION_DATA_PATH`: Local path that will be mounted as Transmission's data folder (for incomplete torrents, settings etc)
* `MOVIE_LIBRARY_PATH`: The directory where the completed torrents awaiting triage and the organized movies, covers and subtitles are stored.
* OpenVPN configuration for [the Transmission/OpenVPN image](https://hub.docker.com/r/haugene/transmission-openvpn/):
    * `OPENVPN_PROVIDER`: See documentation for `haugene/transmission-openvpn`
    * `OPENVPN_USERNAME`
    * `OPENVPN_PASSWORD`