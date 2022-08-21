#!/usr/bin/env python
import logging.config

from rq import Connection, Worker
import redis
import os
import requests


logging.config.dictConfig({
    'version': 1,
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
            'stream': 'ext://sys.stdout',
        },
    },
    'loggers': {
        '': {
            'level': 'INFO',
            'handlers': ['console'],
        },
        'rq.worker': {
            'level': 'WARNING',
            'handlers': ['console'],
        }
    },
})


def conversion_exception_handler(job, exc_type, exc_value, traceback):
    if 'callback_url' in job.kwargs:
        requests.post(job.kwargs['callback_url'], json={'status': 'conversion-failed'})


with Connection(redis.from_url(os.environ['REDIS_DB_URL'])):
    conversion_worker = Worker(['conversion', 'subtitles'], log_job_description=False)
    conversion_worker.push_exc_handler(conversion_exception_handler)
    conversion_worker.work(logging_level=logging.WARNING)
