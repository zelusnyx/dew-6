from flask import request
from flask_restplus import Resource
from DEWAPI.api.common.serializers import blog_post, ns_object, parse_request, translate_request, suggestion_object
from DEWAPI.api.restplus import api
from ..services.hlbServices import HLBService
import globals

ns = api.namespace('v1/hlb', description='Operations related to hlb')

obj = HLBService()

@ns.route('/translate/<string:format>')
class HandleTranslator(Resource):
    # Return type is not necessary since we return everything to the client. The client can choose on how to display the information.
    @api.expect(translate_request)
    def put(self,format):
        """
            Takes a file as an input and returns the dew format
        """
        script = request.get_json(force=True)['Script']
        parsed_dew, scenarios, constraints, bindings, actor = obj.HandleTranslator(format, script)

        return { 'dew': parsed_dew, 'scenarios': scenarios, 'constraints': constraints, 'bindings': bindings, 'actor': actor }

@ns.route('/parse')
class HandleParser(Resource):

    @api.expect(parse_request)
    def put(self):
        """
          Take an input string (behavior) and return the actors, triggers, actions, emit events and wait times. This can be used for auto completing the actors list.
        """
        json_data = request.get_json(force=True)
        parsed_data = obj.HandleParse(json_data)
        return parsed_data

@ns.route('/generateNs')
class HandleGeneratorNs(Resource):

    @api.expect(ns_object)
    @api.representation('text/plain')
    def put(self):
        """
          Generates NS file for given behaviors, actors, and constraints
        """
        json_data = request.get_json(force=True)
        script = obj.HandleNS(json_data)
        return {'script': script}

@ns.route('/generateMergeTB')
class HandleGeneratorMergeTB(Resource):

    @api.expect(ns_object)
    @api.representation('text/plain')
    def put(self):
        """
          Generates Merge TB file for given behaviors, actors, and constraints
        """
        json_data = request.get_json(force=True)
        script = obj.HandleMergeTB(json_data)
        return {'script': script}

@ns.route('/suggestions')
class HandleSuggestions(Resource):


    @api.expect(suggestion_object)
    def put(self):
        """
          Gets suggestions for given input
        """

        # TODO : Remove globals
        globals.actors=dict()
        globals.behaviors=dict()
        globals.constraints=dict()
        globals.events=dict()
        globals.actions=dict()
        json_data = request.get_json(force=True)
        print(len(json_data['suggestion_for']))
        if json_data["type"] == "behavior":
          s, t = obj.HandleBehaviorSuggestions(json_data["behaviors"], json_data['actors'], json_data['suggestion_for'])
          return { 'suggestions': s, 'suggestion_text': t}
        elif json_data["type"] == "constraint":
          s, t = obj.HandleConstraintSuggestions(json_data["constraints"], json_data["actors"], json_data["suggestion_for"], json_data["behaviors"])
          return { 'suggestions': s, 'suggestion_text': t}
        else:
          pass
