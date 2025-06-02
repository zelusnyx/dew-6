import os
# Flask settings
FLASK_SERVER_NAME = 'localhost:8800'
FLASK_DEBUG = False # Do not use debug mode in production
FLASK_HOST = 'localhost:8800'

# Flask-Restplus settings
RESTPLUS_SWAGGER_UI_DOC_EXPANSION = 'list'
RESTPLUS_VALIDATE = True
RESTPLUS_MASK_SWAGGER = False
RESTPLUS_ERROR_404_HELP = False

SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URI")

ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")

DETERLAB_USER_URL = os.environ.get("DETERLAB_USER_URL")

if not SQLALCHEMY_DATABASE_URI:
    raise ValueError("Valid database URI not provided")


SQLALCHEMY_TRACK_MODIFICATIONS = False
