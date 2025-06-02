# import logging
import traceback

from flask_restplus import Api
from DEWAPI import settings

# log = logging.getLogger(__name__)

api = Api(version='1.0', title='DEW API',
          description='DEW API...')

@api.errorhandler
def default_error_handler(e):
    message = 'An unhandled exception occurred.'
    # log.exception(message)

    if not settings.FLASK_DEBUG:
        return {'message': message}, 500



