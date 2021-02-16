# Home server

Home server backend and frontend. It's a sort of personal Netflix. For more info, read the [full introduction](https://nicolasbouliane.com/projects/home-server).

The backend is built with Django and the frontend with Vue.js. It runs inside Docker.

![](https://nicolasbouliane.com/images/_ultrawide/Home-page.jpg)

## Setup

1. Put your SSL certificates in `proxy/ssl-certs`. These are expected:
    * `server.key`, the key used to generate your SSL certificate
    * `cert-chain.crt`, created by running `cat server.crt server.ca-bundle >> cert-chain.crt`
2. Run `scripts/setup.sh` to setup the project. It will ask a few questions and create a config file for you.
3. Run `docker-compose up --build -d` to start all the components.
4. If necessary, run `scripts/create-user.sh` to create your first user.

### Environment variables

Put these environment variables in a `.env` file. These environment variables are used by the project.

* `BACKEND_SECRET_KEY`: A unique, random, secret string used by Django. [Explanation](https://docs.djangoproject.com/en/3.1/ref/settings/#secret-key)
* `DEFAULT_VIDEO_HEIGHT`: The default height for converted videos, in pixels. Defaults to 720.
* `DIGITALOCEAN_TOKEN`: API token used to update dynamic DNS. [Explanation](https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/).
* `MAX_VIDEO_BITRATE`: The maximum video bitrate allowed, in bits per second. Defaults to 2000000.
* `TRANSMISSION_DATA_PATH`: Path to Transmission's data folder on your local filesystem. Incomplete torrents and Transmission settings are stored there.
* `MOVIE_LIBRARY_PATH`: Path to the movie library. Movies, subtitles and covers are stored there.
* `AUTH_COOKIE_DOMAIN` (optional): The domain used for authentication cookies. Defaults to the current domain.
* `BACKEND_DEBUG` (optional): Set to `1` to enable Django backend debugging. Error pages will have meaningful error messages. Not safe for production.
* `COMPOSE_PROJECT_NAME` (optional): The prefix for this project's docker networks, images, volumes etc. [Explanation](https://docs.docker.com/compose/reference/envvars/).
* OpenVPN configuration for [the Transmission/OpenVPN image](https://hub.docker.com/r/haugene/transmission-openvpn/):
    * `OPENVPN_PROVIDER`: See documentation for `haugene/transmission-openvpn`
    * `OPENVPN_USERNAME`
    * `OPENVPN_PASSWORD`