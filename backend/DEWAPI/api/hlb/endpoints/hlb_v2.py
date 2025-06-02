from flask import request
from flask_restplus import Resource
from DEWAPI.api.common.serializers import blog_post, ns_object, parse_request, translate_request, suggestion_v2_object
from DEWAPI.api.restplus import api
import DEWAPI.api.persistence.services.sqlite3 as db_service
from ..services.hlbServices import HLBService
import globals,json

ns = api.namespace('v2/hlb', description='Operations related to hlb')

@ns.route('/suggestions')
class HandleRetireve(Resource):
    @api.expect(suggestion_v2_object)
    def put(self):
        """
            Retrieve content from database
        """
        json_data = request.get_json(force=True)
        print(json_data)
        experiment = json.loads(db_service.find_experiment(json_data['username'])['experiment'])
        obj = HLBService()
      
      # TODO : Remove globals
        globals.actors=dict()
        globals.behaviors=dict()
        globals.constraints=dict()
        globals.events=dict()
        globals.actions=dict()

        if json_data["type"] == "behavior":
            s, t = obj.HandleBehaviorSuggestions(experiment["behaviors"], experiment['actors'], json_data['suggestion_for'])
            return { 'suggestions': s, 'suggestion_text': t}
        elif json_data["type"] == "constraint":
            s, t = obj.HandleConstraintSuggestions(experiment["constraints"], experiment["actors"], json_data["suggestion_for"], experiment["behaviors"])
            return { 'suggestions': s, 'suggestion_text': t}
        else:
            pass
