# Home server

Home server backend and frontend. It's a sort of personal Netflix. For more info, read the [full introduction](https://nicolasbouliane.com/projects/home-server).

The backend is built with Django and the frontend with Vue.js. It runs inside Docker.

![](https://nicolasbouliane.com/images/_ultrawide/Home-page.jpg)

## Setup

1. Set the required environment variables, as described below.
2. Run `docker-compose up --build -d` to start all the components.
3. If necessary, run `scripts/create-user.sh` to create your first admin user.

### Environment variables

Put these environment variables in a `.env` file at the root of the project (next to this README file). These environment variables are used by the project.

You can use the `.env.example` file as a template.

* `GOOGLE_MAPS_API_KEY`: A Google Maps API key used to show a map on the timeline
* `BACKEND_SECRET_KEY`: A unique, random, secret string used by Django. [Explanation](https://docs.djangoproject.com/en/3.1/ref/settings/#secret-key).
* `DEFAULT_VIDEO_HEIGHT`: The default height for converted videos, in pixels. Defaults to 720.
* `DIGITALOCEAN_TOKEN` (optional): DigitalOcean API token. Used for dynamic DNS. [Here's how you get that token](https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/). If you leave it empty, dynamic DNS will stay disabled.
* `MAX_VIDEO_BITRATE`: The maximum video bitrate allowed, in bits per second. Defaults to 2000000.
* `TRANSMISSION_DATA_PATH`: Path to Transmission's data folder on your filesystem. Incomplete torrents and Transmission settings are stored there.
* `TIMELINE_DATA_PATH`: Path to the files that appear on the timeline
* `MOVIE_LIBRARY_PATH`: Path to the movie library on your filesystem. Movies, subtitles and covers are stored there.
* `AUTH_COOKIE_DOMAIN` (optional): The domain used for authentication cookies. Defaults to the current hostname.
* `BACKEND_DEBUG` (optional): Set to `1` to enable Django backend debugging. Error pages will have meaningful error messages. Not safe for production.
* `COMPOSE_PROJECT_NAME` (optional): The prefix for this project's docker networks, images, volumes etc. [Explanation](https://docs.docker.com/compose/reference/envvars/).
* `SSL_DOMAIN`: Domain for which to generate an SSL certificate. If set to `localhost`, a self-signed certificate will be generated.
* `SSL_EMAIL`: Email used for SSL certificate notifications
* OpenVPN configuration for [the Transmission/OpenVPN image](https://hub.docker.com/r/haugene/transmission-openvpn/):
    * `OPENVPN_PROVIDER`: See documentation for `haugene/transmission-openvpn`. Use 'PIA' for Private Internet Access.
    * `OPENVPN_USERNAME`
    * `OPENVPN_PASSWORD`