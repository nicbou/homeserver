import os
from pathlib import Path

# ==================================================
# Django stuff
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ROOT = Path("/var/backend/staticfiles")
STATIC_URL = "/static/"

TRIAGE_PATH = Path("/movies/triage")
MOVIE_LIBRARY_PATH = Path("/movies/library")
MOVIE_LIBRARY_URL = "/movies"

GPX_LOGS_PATH = Path("/var/log/gps")

VIDEO_EXTENSIONS = (
    ".3gp",
    ".avi",
    ".divx",
    ".flv",
    ".m4v",
    ".mkv",
    ".mov",
    ".mp4",
    ".mpe",
    ".mpeg",
    ".mpg",
    ".ogm",
    ".wmv",
)
SUBTITLE_EXTENSIONS = (".srt", ".vtt")

LOGIN_REDIRECT_URL = "/"

SECRET_KEY = os.environ.get("BACKEND_SECRET_KEY", False)

DEBUG = os.environ.get("BACKEND_DEBUG", False) == "1"

ALLOWED_HOSTS = ["*"]
CSRF_TRUSTED_ORIGINS = [
    "https://localhost",
    "https://home.nicolasbouliane.com",
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {"format": "%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s"},
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "level": "ERROR",
        },
        "gunicorn": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
        "gunicorn.access": {
            "level": "ERROR",
        },
    },
}


INSTALLED_APPS = (
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.messages",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "movies",
    "authentication",
    "gps_logger",
)

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.contrib.auth.context_processors.auth",
                "django.template.context_processors.debug",
                "django.template.context_processors.i18n",
                "django.template.context_processors.media",
                "django.template.context_processors.static",
                "django.template.context_processors.tz",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.request",
            ],
        },
    },
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

ROOT_URLCONF = "backend.urls"
WSGI_APPLICATION = "backend.wsgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB"),
        "USER": os.environ.get("POSTGRES_USER"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD"),
        "HOST": os.environ.get("POSTGRES_HOST"),
        "PORT": 5432,
    }
}
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True
USE_X_FORWARDED_HOST = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
