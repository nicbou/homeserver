#!/usr/bin/env python
import asyncio
import json
import logging
import logging.config
from urllib.parse import urlparse, parse_qs

import websockets

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
            'stream': 'ext://sys.stdout',
        },
    },
    'loggers': {
        '': {
            'level': 'INFO',
            'handlers': ['console'],
        },
    },
})
logger = logging.getLogger(__name__)


STATE = {
    'rooms': {}
}


def json_state(room: str, sender: str = None, change_type: str = None) -> str:
    room_obj = STATE['rooms'][room]

    message = {
        'position': room_obj['position'],
        'status': room_obj['status'],
        'users': [username for username, socket in room_obj['users'].items()],
        'sender': sender,
    }

    if sender:
        message['sender'] = sender

    if change_type:
        message['change_type'] = change_type

    return json.dumps(message)


async def state_changed(room: str, sender: str, change_type: str = None):
    """
    Notify all users in a room of a state change
    """
    if room in STATE['rooms']:
        message = json_state(room, sender, change_type)
        await asyncio.wait([
            socket.send(message)
            for username, socket in STATE['rooms'][room]['users'].items()
        ])


async def join_room(room: str, username: str, socket: websockets.WebSocketServerProtocol):
    """
    Add a user to a room, creating the room if it doesn't exist
    """
    logger.debug(f'{username} joined "{room}"')
    if room in STATE['rooms']:
        STATE['rooms'][room]['users'][username] = socket
    else:
        STATE['rooms'][room] = {
            'position': 0,
            'status': 'paused',
            'users': {username: socket}
        }

    await state_changed(room, username, 'user-join')


async def leave_room(room: str, username: str):
    """
    Remove a user from a room, deleting the room if it's empty
    """
    logger.debug(f'{username} left "{room}"')
    try:
        STATE['rooms'][room]['users'].pop(username)
    except KeyError:
        logger.warning(f'Removing non-existant user "{username}" from room "{room}"')

    if len(STATE['rooms'][room]['users']) > 0:
        await state_changed(room, username, 'user-leave')
    else:
        logger.info(f'Closing empty room "{room}"')
        del STATE['rooms'][room]


async def play(room: str, username: str, position: int):
    logger.debug(f'{username} played "{room}" at {position}s')
    STATE['rooms'][room]['status'] = 'playing'
    STATE['rooms'][room]['position'] = position
    await state_changed(room, username, 'play')


async def pause(room: str, username: str, position: int):
    logger.debug(f'{username} paused "{room}" at {position}s')
    STATE['rooms'][room]['status'] = 'paused'
    STATE['rooms'][room]['position'] = position
    await state_changed(room, username, 'pause')


async def seek(room: str, username: str, position: int):
    logger.debug(f'{username} seeked "{room}" to {position}s')
    STATE['rooms'][room]['position'] = position
    await state_changed(room, username, 'seek')


async def rooms(user_websocket: websockets.WebSocketServerProtocol, uri: str):
    query = parse_qs(urlparse(uri).query)
    room = query['room'][0]
    username = query['user'][0]
    await join_room(room, username, user_websocket)
    try:
        async for message in user_websocket:
            data = json.loads(message)
            if data['action'] == 'play':
                await play(room, username, data['position'])
            elif data['action'] == 'pause':
                await pause(room, username, data['position'])
            elif data['action'] == 'seek':
                await seek(room, username, data['position'])
            else:
                logging.error(f"unsupported event: {data}")
    except websockets.exceptions.ConnectionClosedError as exc:
        logger.debug(f'ConnectionClosedError from {username} in room "{room}" - code {exc.code}')
    finally:
        await leave_room(room, username)


start_server = websockets.serve(rooms, 'backend', 81)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
