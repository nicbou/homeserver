import os
import logging.config
from pathlib import Path

# ==================================================
# Django stuff
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ROOT = Path('/srv/static')
MEDIA_ROOT = Path('/srv/media')
STATIC_URL = '/static/'

SECRET_KEY = os.environ.get('BACKEND_SECRET_KEY', False)

DEBUG = os.environ.get('BACKEND_DEBUG', False) == '1'

ALLOWED_HOSTS = ['*']

LOGGING_CONFIG = None
logging.config.dictConfig({
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'console': {
            "()": "coloredlogs.ColoredFormatter",
            'format': '%(asctime)s %(levelname)s [%(name)s:%(lineno)s] %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'console',
        },
    },
    'loggers': {
        '': {
            'level': 'INFO',
            'handlers': ['console'],
        },
        'gunicorn.access': {
            'level': 'ERROR',
            'handlers': ['console'],
            'propagate': True,
            'qualname': 'gunicorn.access',
        },
        'django.request': {
            'level': 'ERROR',
            'handlers': ['console'],
        },
    },
})

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.messages',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'movies',
    'authentication',
)

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('POSTGRES_HOST'),
        'PORT': 5432,
    }
}
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
USE_X_FORWARDED_HOST = True

# ==================================================
# App-specific stuff
# ==================================================

LOGIN_REDIRECT_URL = '/'
MOVIE_LIBRARY_PATH = Path(os.environ.get('MOVIE_LIBRARY_PATH'))
MOVIE_LIBRARY_URL = os.environ.get('MOVIE_LIBRARY_URL')
TRIAGE_PATH = Path(os.environ.get('TRIAGE_PATH'))
VIDEO_EXTENSIONS = (
    '.mkv', '.avi', '.mpg', '.wmv', '.mov', '.m4v', '.3gp', '.mpeg', '.mpe', '.ogm', '.flv', '.divx', '.mp4'
)
SUBTITLE_EXTENSIONS = ('.srt', '.vtt')