# Home server

## Setup

0. Set the environment variables required to run the server (see `docker-compose.yml` for all the variables). These can be added to a Docker `.env` file or set manually:
    * `BACKEND_SECRET_KEY`: A random string used by Django. Keep this secret.
    * `BACKEND_DEBUG`: '1'. Any other value sets debugging to false.
    * `DB_PERSISTENCE_PATH`: A folder to persist the database data.
    * `COMMERZBANK_ACCOUNT_NUMBER`: Commerzbank login number.
    * `COMMERZBANK_PASSWORD`: Commerzbank login password.
    * `N26_USERNAME`
    * `N26_PASSWORD`
1. Run `docker-compose up` to start all the components
2. If necessary, run `docker-compose exec backend createsuperuser` to generate your first user.