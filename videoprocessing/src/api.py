#!/usr/bin/python
from pathlib import Path

from bottle import route, run, request, abort, response
import os
import redis
from rq import Queue
from jobs import convert_to_mp4, extract_mkv_subtitles, convert_subtitles_to_vtt

redis_connection = redis.from_url(os.environ['REDIS_DB_URL'])
conversion_queue = Queue('conversion', connection=redis_connection)
subtitles_queue = Queue('subtitles', connection=redis_connection)
movie_library_path = Path(os.environ.get('MOVIE_LIBRARY_PATH'))


@route('/videoToMp4', method='POST')
def video_to_mp4():
    response.content_type = 'application/json'
    if not request.json.get('input'):
        abort(400, {'result': 'failure', 'message': '`input` parameter is missing from request payload'})

    input_file = movie_library_path / request.json.get('input')
    output_file = Path(str(input_file).replace("".join(input_file.suffixes), '.converted.mp4'))
    callback_url = request.json.get('callbackUrl')

    if not input_file.exists():
        abort(404, {'result': 'failure', 'message': 'Input file does not exist'})

    conversion_queue.enqueue(
        convert_to_mp4,
        kwargs={
            'input_file': str(input_file),
            'output_file': str(output_file),
            'callback_url': callback_url,
        },
        job_timeout=21600  # 6 hours
    )
    if input_file.suffix.lower() == '.mkv':
        subtitles_queue.enqueue(
            extract_mkv_subtitles,
            kwargs={
                'input_file': str(input_file),
                'callback_url': callback_url,
            },
            job_timeout=1800  # 30 min
        )

    response.status = 202
    return {'result': 'success', 'message': 'Movie queued for conversion.'}


@route('/subtitlesToVTT', method='POST')
def subtitles_to_vtt():
    response.content_type = 'application/json'
    if not request.json.get('input'):
        abort(400, {'result': 'failure', 'message': '`input` parameter is missing from request payload'})

    input_file = movie_library_path / request.json.get('input')
    output_file = Path(str(input_file).replace("".join(input_file.suffixes), '.vtt'))
    subtitles_queue.enqueue(
        convert_subtitles_to_vtt,
        kwargs={
            'input_file': str(input_file),
            'output_file': str(output_file),
        },
        job_timeout=1800  # 30 min
    )

    response.status = 202
    return {'result': 'success', 'message': 'Subtitles queued for conversion.'}


run(host='videoprocessing', port=80, debug=True)
