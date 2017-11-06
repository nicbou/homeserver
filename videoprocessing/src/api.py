#!/usr/bin/python
from bottle import route, run, request, abort, response
import os
import redis
from rq import Queue
from tasks import convert_to_mp4, extract_mkv_subtitles

task_queue = Queue(connection=redis.from_url('redis://redis:6379/1'))
movie_library_path = os.environ.get('MOVIE_LIBRARY_PATH')


@route('/process', method='POST')
def process():
    response.content_type = 'application/json'
    if not request.json.get('input'):
        abort(400, {'result': 'failure', 'message': '`input` parameter is missing from request payload'})

    input_file = u'{}/{}'.format(movie_library_path, request.json.get('input'))
    extension = '.converted.mp4'
    output_file = "{path}{extension}".format(
        path=".".join(input_file.split('.')[0:-1]),
        extension=extension
    )
    callback_url = request.json.get('callbackUrl')

    if not os.path.exists(input_file):
        abort(404, {'result': 'failure', 'message': 'Input file does not exist'})

    task_queue.enqueue(convert_to_mp4, args=(input_file, output_file, callback_url), timeout=21600)
    if input_file.endswith('.mkv'):
        task_queue.enqueue(extract_mkv_subtitles, input_file)

    response.status = 202
    return {'result': 'success', 'message': 'Movie queued for conversion.'}

run(host='videoprocessing', port=80, debug=True)
