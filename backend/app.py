
import os
import sys
from flask import Flask, Blueprint, request
# from flask_restplus import Api
from DEWAPI import settings
# from DEWAPI.api.hlb.endpoints.hlb import ns as hlb_namespace
# from DEWAPI.api.hlb.endpoints.hlb_v2 import ns as hlb_v2_namespace
# from DEWAPI.api.nlp.endpoints.nlp import ns as nlp_namespace
# from DEWAPI.api.persistence.endpoints.persist import ns as persist_namespace
# from DEWAPI.api.upload.endpoints.parse_dew import ns as upload_namespace
# from DEWAPI.api.userinfo.endpoints.userinfo import ns as user_namespace
# from DEWAPI.api.token_based.endpoints.token import ns as token_namespace
from DEWAPI.api.private.endpoints.privateapi import ns as private_namespace
from DEWAPI.api.public.endpoints.publicapi import ns as public_namespace
from DEWAPI.api.restplus import api
from extensions import db
from DEWAPI.authenticationFilter import AuthFilter

auth = AuthFilter()
def authenticate():
    flag, message = auth.checkCors()
    if flag:
        privateFLag, unauthorizedFlag, message = auth.isUrlPathPrivate()
        if not unauthorizedFlag:
            return {"message":message}, 401
        else:
            if privateFLag:
                flag, message = auth.authorizeUser()
                if flag:
                    return {"message":message}, 401
                else:
                    pass
            else:
                pass
    else: 
        return {"message":message}, 401

def register_extensions(app):
    blueprint = Blueprint('api', __name__, url_prefix='/api')
    blueprint.before_request(authenticate)
    api.init_app(blueprint)
    api.add_namespace(private_namespace)
    api.add_namespace(public_namespace)
    app.register_blueprint(blueprint)
    db.init_app(app)

def create_app():
    flask_app = Flask(__name__)
    # app.debug = true
    flask_app.config.from_object('DEWAPI.settings')
    register_extensions(flask_app)
    return flask_app


app = create_app()
