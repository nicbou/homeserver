# Home server

Home server backend and frontend. The backend is built with Django and the frontend with Vue.js. They are brought together with Docker.

## Setup

1. Set the environment variables required to run the server (see `docker-compose.yml` for all the variables). These can be added to a Docker `.env` file or set manually:
    * `BACKEND_SECRET_KEY`: A random string used by Django. Keep this secret.
    * `BACKEND_DEBUG`: '1'. Any other value sets debugging to false.
    * `BACKEND_FIXTURES_PATH`: Fixtures in this directory will be loaded in the database.
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
2. Put your fixtures in the BACKEND_FIXTURES_PATH.
3. Run `docker-compose build` to build all the components.
4. Run `docker-compose up` to start all the components.
5. If necessary, run `docker-compose exec backend python manage.py createsuperuser` to create your first user.
6. Remove the fixtures from BACKEND_FIXTURES_PATH.