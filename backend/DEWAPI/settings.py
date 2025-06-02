# Flask settings
FLASK_SERVER_NAME = 'localhost:8800'
FLASK_DEBUG = True # Do not use debug mode in production
FLASK_HOST = 'localhost:8800'

# Flask-Restplus settings
RESTPLUS_SWAGGER_UI_DOC_EXPANSION = 'list'
RESTPLUS_VALIDATE = True
RESTPLUS_MASK_SWAGGER = False
RESTPLUS_ERROR_404_HELP = False

SQLALCHEMY_DATABASE_URI = 'sqlite:///db/database.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False
ENCRYPTION_KEY = "d41d8cd98f00b204e9800998ecf8427e"
DETERLAB_USER_URL = 'users.deterlab.net'
