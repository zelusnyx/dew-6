from extensions import db
from DEWAPI.models.auth_token import AuthToken
from DEWAPI.models.experiment import Experiment
from DEWAPI.models.access_control import AccessControl
from utilities.access_control_enum import AccessControlEnum
from datetime import datetime
import uuid
import json

class TokenManager(object):
    def create_token(self, experiment_id, access_level, creator_uid):
        if self.user_can(experiment_id, creator_uid, AccessControlEnum.manage.value):
            atoken = AuthToken(experiment_id=experiment_id, creator_uid=creator_uid, access_level=access_level, active=True, token=str(uuid.uuid4()))
            db.session.add(atoken)
            db.session.commit()

            return atoken.to_dict()
        else:
            raise ValueError("Forbidden")

    
    def get_tokens(self, experiment_id, uid):
        if self.user_can(experiment_id, uid, AccessControlEnum.manage.value):
            tokens = [t.to_dict() for t in AuthToken.query.filter(AuthToken.experiment_id == experiment_id).all()]
            return tokens
        else:
            raise ValueError("Forbidden")
    
    def get_experiment_data(self, token):
        auth_token = AuthToken.query.filter(AuthToken.token==token, AuthToken.active == True).first()
        if auth_token is None:
            raise ValueError("Not found")
        experiment = Experiment.query.filter(Experiment.experiment_id == auth_token.experiment_id, Experiment.deleted_at == None).first()
        if experiment is None:
            raise ValueError("Not found")
        else:
            return experiment
    def getTokenDetails(self,token):
        auth_token = AuthToken.query.filter(AuthToken.token==token).first()
        return auth_token.to_dict()
    def toggle_token(self, token, experiment_id, uid):
        if self.user_can(experiment_id, uid, AccessControlEnum.manage.value):
            auth_token = AuthToken.query.filter(AuthToken.token==token).first()
            auth_token.active = not auth_token.active
            db.session.commit()
            return auth_token.to_dict()
        else:
            raise ValueError("Forbidden")

    def update_experiment(self, token, update_content):
        auth_token = AuthToken.query.filter(AuthToken.token==token, AuthToken.access_level == 'write', AuthToken.active == True).first()
        if auth_token is None:
            raise ValueError('Forbidden')

        experiment = Experiment.query.filter(Experiment.experiment_id == auth_token.experiment_id, Experiment.deleted_at == None).first()
        experiment.name = update_content['name']
        experiment.description = update_content['description']
        experiment.content = json.dumps({'actors': update_content['actors'], 'behaviors': update_content['behaviors'], 'bindings': update_content['bindings'], 'constraints': update_content['constraints']})
        db.session.commit()
        return experiment

    def user_can(self, experiment_id, user_id, action):
        ac = AccessControl.query.filter(AccessControl.experiment_id==experiment_id, AccessControl.uid==user_id,AccessControl.expiry_date>datetime.today(), AccessControl.access_level>=action).first()
        return (ac is not None)

    def getTokenList(self,experiment_id,creater_id):
        result = [e.to_dict() for e in AuthToken.query.filter(AuthToken.experiment_id == experiment_id, AuthToken.creator_uid == creater_id)]
        
        # print(result)
        return result