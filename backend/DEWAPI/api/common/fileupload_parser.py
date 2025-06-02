from flask_restplus import fields
from DEWAPI.api.restplus import api
from flask_restplus import reqparse
import werkzeug

upload_parser = api.parser()
upload_parser.add_argument('file', location='files',
                   type=werkzeug.datastructures.FileStorage, required=True)

parser = reqparse.RequestParser()
parser.add_argument('upload', required = True)
