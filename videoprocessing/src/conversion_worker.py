#!/usr/bin/env python
from rq import Connection, Worker
import redis
import os
import requests


def conversion_exception_handler(job, exc_type, exc_value, traceback):
    if 'callback_url' in job.kwargs:
        requests.post(job.kwargs['callback_url'], json={'status': 'conversion-failed'})


with Connection(redis.from_url(os.environ['REDIS_DB_URL'])):
    conversion_worker = Worker(['conversion'])
    conversion_worker.push_exc_handler(conversion_exception_handler)
    conversion_worker.work()
