#!/usr/bin/python
import logging
from pathlib import Path

from bottle import route, run, request, abort, response
import os
import redis
from rq import Queue
from jobs import convert_to_mp4, extract_subtitles, convert_subtitles

redis_connection = redis.from_url(os.environ['REDIS_DB_URL'])
conversion_queue = Queue('conversion', connection=redis_connection)
subtitles_queue = Queue('subtitles', connection=redis_connection)
movie_library_path = Path(os.environ.get('MOVIE_LIBRARY_PATH'))

logger = logging.getLogger(__name__)


@route('/convert', method='POST')
def convert_video():
    response.content_type = 'application/json'
    if not (request.json.get('input') and request.json.get('output')):
        logger.error('`input` or `output` parameter is missing from request payload')
        abort(400, {'result': 'failure', 'message': '`input` or `output` parameter is missing from request payload'})

    input_file = movie_library_path / request.json.get('input')
    output_file = movie_library_path / request.json.get('output')
    callback_url = request.json.get('callbackUrl')

    if not input_file.exists():
        logger.error(f"Input file does not exist: '{Path(input_file)}'")
        abort(404, {'result': 'failure', 'message': 'Input file does not exist'})

    logger.info(f"Queueing {str(input_file)} for conversion")

    conversion_queue.enqueue(
        convert_to_mp4,
        kwargs={
            'input_file': str(input_file),
            'output_file': str(output_file),
            'callback_url': callback_url,
        },
        job_timeout=21600  # 6 hours
    )

    logger.info(f"Queueing {str(input_file)} for subtitle extraction")
    subtitles_queue.enqueue(
        extract_subtitles,
        kwargs={
            'input_file': str(input_file),
        },
        job_timeout=60*60
    )

    response.status = 202
    return {'result': 'success', 'message': 'Movie queued for conversion.'}


@route('/extractSubtitles', method='POST')
def extract_all_subtitles():
    response.content_type = 'application/json'
    if not request.json.get('input'):
        abort(400, {'result': 'failure', 'message': '`input` parameter is missing from request payload'})

    input_file = movie_library_path / request.json.get('input')
    if not input_file.exists():
        logger.error(f"Input file does not exist: '{Path(input_file)}'")
        abort(404, {'result': 'failure', 'message': 'Input file does not exist'})

    logger.info(f"Queueing {str(input_file)} for subtitle extraction")
    subtitles_queue.enqueue(
        extract_subtitles,
        kwargs={
            'input_file': str(input_file),
        },
        job_timeout=60*60
    )

    response.status = 202
    return {'result': 'success', 'message': 'Subtitles queued for extraction.'}


@route('/convertSubtitles', method='POST')
def convert_subtitles_to_vtt():
    response.content_type = 'application/json'
    if not request.json.get('input'):
        abort(400, {'result': 'failure', 'message': '`input` parameter is missing from request payload'})

    input_file = movie_library_path / request.json.get('input')
    if not input_file.exists():
        logger.error(f"Input file does not exist: '{Path(input_file)}'")
        abort(404, {'result': 'failure', 'message': 'Input file does not exist'})

    logger.info(f"Queueing {str(input_file)} for subtitle extraction")
    subtitles_queue.enqueue(
        convert_subtitles,
        kwargs={
            'input_file': str(input_file),
        },
        job_timeout=60
    )

    response.status = 202
    return {'result': 'success', 'message': 'Subtitles queued for conversion.'}


run(host='videoprocessing', port=80, debug=True)
