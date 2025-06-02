import sys, json
from DEWAPI.api.restplus import api
from flask import request, escape
from flask_restplus import Resource
from DEWAPI.api.common.serializers import token_data, tokenListModel,uid_header_parser, experiment_update_by_token, token_data_small
from DEWAPI.models.user import User
from DEWAPI.models.auth_token import AuthToken
from DEWAPI.api.token_based.services.token_manager import TokenManager

ns = api.namespace('v1/token-based-auth', description='Access experiments using tokens')

tm = TokenManager()

@ns.route('/create')
class HandleRootPath(Resource):
    @api.expect(token_data)
    def post(self):
        """
        Create token for a given experiment
        """
        content = request.get_json(force=True)
        experiment_id = content['experiment_id']
        access_level = content['access_level']
        creator_uid = content['creator_uid']

        try:
            token = tm.create_token(experiment_id, access_level, creator_uid)
            return token, 201
        except ValueError as e:
            if str(e) == "Forbidden":
                return {}, 403


@ns.route('/getTokenList')
class HandleGetTokenList(Resource):
    @api.expect(tokenListModel)
    def post(self):
        """
        Create token for a given experiment
        """
        content = request.get_json(force=True)
        experiment_id = content['experiment_id']
        creator_uid = content['creator_uid']

        try:
            result = []
            tokenList = tm.getTokenList(experiment_id, creator_uid)
            for t in tokenList:
                obj = {}
                obj['token'] = t['token']
                obj['accessLevel'] = t['access_level']
                obj['status'] = t['active']
                result.append(obj)
            return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
                return {}, 403


@ns.route('/getdetails/<access_token>')
class HandleGetExperiment(Resource):
    def get(self, access_token):
        """
        Get experiment from token
        """
        # content = request.get_json(force=True)
        # experiment_id = content['experiment_id']
        try:
            experiment = tm.get_experiment_data(access_token)
            result = {}
            if experiment is not None:
                r = experiment.to_dict()
                result=json.loads(r['content'])
                result['name'] = r['name']
                result['description'] = r['description']
            return {'status': 'Successful', 'data': result }
        except ValueError as e:
            if(str(e) == "Not found"):
                return {'status': 'Failure'}, 404


@ns.route('/get/<access_token>')
class HandleGetTokenInformation(Resource):
    def get(self, access_token):
        """
        Get experiment from token
        """
        # content = request.get_json(force=True)
        # experiment_id = content['experiment_id']
        try:
            tokenDetails = tm.getTokenDetails(access_token)
            result = {}
            if tokenDetails is not None:
                result['token'] = tokenDetails['token']
                result['level']=tokenDetails['access_level']
                result['status']=tokenDetails['active']
            return {'status': 'Successful', 'data': result }
        except ValueError as e:
            if(str(e) == "Not found"):
                return {'status': 'Failure'}, 404

@ns.route('/update/<access_token>')
class HandleGetExperiment(Resource):
    @api.expect(experiment_update_by_token)
    def put(self, access_token):
        """
        Get experiment from token
        """
        update_content = request.get_json(force=True)

        # experiment_id = content['experiment_id']
        try:
            experiment = tm.update_experiment(access_token, update_content)
            return {'status': 'Successful', 'data': experiment.to_dict() }
        except ValueError as e:
            if(str(e) == "Not found"):
                return {'status': 'Failure'}, 404
            elif (str(e) == "Forbidden"):
                return {'status': 'Failure'}, 403


@ns.route('/toggle/')
class HandleTogglePath(Resource):
    @api.expect(token_data_small)
    def put(self):
        """
        Create token for a given experiment
        """
        content = request.get_json(force=True)
        experiment_id = content['experiment_id']
        token = content['token']
        current_uid = content['current_uid']

        try:
            token = tm.toggle_token(token,experiment_id,current_uid)
            return token, 200
        except ValueError as e:
            if str(e) == "Forbidden":
                return {}, 403
    