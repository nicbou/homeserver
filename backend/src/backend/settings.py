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

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/srv/logs/django.log',
            'formatter': 'verbose'
        },
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'habits',
    'finances',
    'movies',
    'utils',
    'tokenapi',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
)

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
    'tokenapi.backends.TokenBackend',
]

ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
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

# ==================================================
# App-specific stuff
# ==================================================

VIDEO_PROCESSING_API_URL = os.environ.get('VIDEO_PROCESSING_API_URL')

COMMERZBANK_ACCOUNT_NUMBER = os.environ.get('COMMERZBANK_ACCOUNT_NUMBER')
COMMERZBANK_PASSWORD = os.environ.get('COMMERZBANK_PASSWORD')
N26_USERNAME = os.environ.get('N26_USERNAME')
N26_PASSWORD = os.environ.get('N26_PASSWORD')

MOVIE_LIBRARY_PATH = os.environ.get('MOVIE_LIBRARY_PATH')  # The renamed, triaged movies and their artifacts go here
MOVIE_LIBRARY_URL = os.environ.get('MOVIE_LIBRARY_URL')
TRIAGE_PATH = os.environ.get('TRIAGE_PATH')  # The completed torrents go here until they are triaged
