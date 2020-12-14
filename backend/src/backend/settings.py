import logging
import os

# ==================================================
# Django stuff
# ==================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_ROOT = '/srv/static'
MEDIA_ROOT = '/srv/media'

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
        }
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
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'db',
        'PORT': 5432,
    }
}
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
STATIC_URL = '/static/'
USE_X_FORWARDED_HOST = True

# ==================================================
# App-specific stuff
# ==================================================

LOGIN_REDIRECT_URL = '/'
VIDEO_PROCESSING_API_URL = os.environ.get('VIDEO_PROCESSING_API_URL')
MOVIE_LIBRARY_PATH = os.environ.get('MOVIE_LIBRARY_PATH')  # The renamed, triaged movies and their artifacts go here
MOVIE_LIBRARY_URL = os.environ.get('MOVIE_LIBRARY_URL')
TRIAGE_PATH = os.environ.get('TRIAGE_PATH')  # The completed torrents go here until they are triaged
MOVIE_EXTENSIONS = (
    '.mkv', '.avi', '.mpg', '.wmv', '.mov', '.m4v', '.3gp', '.mpeg', '.mpe', '.ogm', '.flv', '.divx', '.mp4'
)
SUBTITLE_EXTENSIONS = ('.srt', '.vtt')