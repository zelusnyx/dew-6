from flask import request
from flask_restplus import Resource
from DEWAPI.api.restplus import api
from DEWAPI.api.common.serializers import *
from DEWAPI.api.public.services.userinfoservice import GoogleLogin
from ..services.logger import Logger
import traceback


ns = api.namespace('v1/p', description='Public operations does not require authentication.')

login = GoogleLogin()

@ns.route('/user/getuserinfo/')
class HandleUserTranslator(Resource):

    @api.expect(user_object)
    def post(self):
        try:
            Logger.backendLog("HandleUserTranslator()", "Entered Class")
            # json_data = request.get_json(force=True)
            # print(token)
            json_data = request.get_json(force=True)
        
            print(json_data)
            Logger.backendLog("HandleUserTranslator()", "Retrieved User Info")
            return login.getUserInfo(json_data["token"])
        except BaseException:
          Logger.backendErrorLog(traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/user/getgoogleuserinfo/')
class HandleUserGoogleInfo(Resource):

    @api.expect(user_object)
    def post(self):
        try:
            Logger.backendLog("HandleUserGoogleInfo()", "Entered Class")
            # json_data = request.get_json(force=True)
            # print(token)
            json_data = request.get_json(force=True)
        
            print(json_data)
            Logger.backendLog("HandleUserGoogleInfo()", "Retrieved User Google Info")
            return login.googleUserInfo(json_data["token"])
        except BaseException:
          Logger.backendErrorLog(traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/user/validateUser/')
class HandleUserValidate(Resource):

    @api.expect(user_object)
    def post(self):
        try:
            Logger.backendLog("HandleUserValidate()", "Entered Class")
            # json_data = request.get_json(force=True)
            # print(token)
            json_data = request.get_json(force=True)
            print(json_data)
            Logger.backendLog("HandleUserValidate()", "Validated User")
            return login.validate(json_data["token"])
        except BaseException:
          Logger.backendErrorLog(traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/user/validateUserHandle/')
class HandleUserHandleValidate(Resource):

    @api.expect(user_handle)
    def post(self):
        try:
            Logger.backendLog("HandleUserHandleValidate()", "Entered Class")
            # json_data = request.get_json(force=True)
            # print(token)
            json_data = request.get_json(force=True)
            Logger.backendLog("HandleUserHandleValidate()", "Validated User Handle")
            return login.validateHandle(json_data["handle"])
        except BaseException:
          Logger.backendErrorLog(traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/user/registerUser/')
class HandleUserHandleRegister(Resource):

    @api.expect(register_user_handle)
    def post(self):
        try:
            Logger.backendLog("HandleUserHandleRegister()", "Entered Class")
            # json_data = request.get_json(force=True)
            # print(token)
            json_data = request.get_json(force=True)
            Logger.backendLog("Registered User Handle()", "Entered Class")
            return login.registerUserHandle(json_data["handle"],json_data["token"])
        except BaseException:
          Logger.backendErrorLog(traceback.format_exc())
          raise Exception("Error Occured on the Server")
    
