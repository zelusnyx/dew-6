import sys, json
from flask import request
from flask_restplus import Resource
from DEWAPI.api.common.serializers import *
from DEWAPI.api.common.fileupload_parser import parser, upload_parser
from DEWAPI.api.restplus import api
from ..services.hlbServices import HLBService
from ..services.nlpServices import NLPService
from ..services.experiment_manager import ExperimentManager
from ..services.dew_parser import DEWParser
from ..services.token_manager import TokenManager
from ..services.profileService import ProfileService
from ..services.sshConnectivity import SSHConnection
from ..services.deterlab_experiment_manager import DeterLabExperimentManager
from DEWAPI.user import userObj
from DEWAPI.api.public.services.userinfoservice import GoogleLogin
from ..services.logger import Logger
import globals
import traceback
import unicodedata


ns = api.namespace('v1/pr', description='Private operations require authentication.')

hlb = HLBService()
nlp = NLPService()
em = ExperimentManager()
dew_parser = DEWParser()
tm = TokenManager()
ps = ProfileService()
dm = DeterLabExperimentManager()
login = GoogleLogin()


@ns.route('/user/getUserHandles/')
class HandleUserGetHandle(Resource):
    def get(self):
        return login.getUserHandles(userObj.getUserId())

@ns.route('/hlb/translate/<string:format>')
class HandleHLBTranslator(Resource):
    # Return type is not necessary since we return everything to the client. The client can choose on how to display the information.
    @api.expect(translate_request)
    def put(self,format):
        """
            Takes a file as an input and returns the dew format
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleHLBTranslator()", "Entered Class")
          script = json_data['Script']
          parsed_dew, scenarios, constraints, bindings, actor = hlb.HandleTranslator(format, script)
          Logger.backendLog(user,"HandleHLBTranslator()", "Successfully Converted to DEW")
          return { 'dew': parsed_dew, 'scenarios': scenarios, 'constraints': constraints, 'bindings': bindings, 'actor': actor }
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/hlb/parse')
class HandleHLBParser(Resource):

    @api.expect(parse_request)
    def put(self):
        """
          Take an input string (behavior) and return the actors, triggers, actions, emit events and wait times. This can be used for auto completing the actors list.
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleHLBParser()", "Entered Class")
          parsed_data = hlb.HandleParse(json_data)
          Logger.backendLog(user,"HandleHLBParser()", "Successfully Parsed Data")
          return parsed_data
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/hlb/generateMergeTB')
class HandleHLBGeneratorMergeTB(Resource):

    @api.expect(ns_object)
    @api.representation('text/plain')
    def put(self):
        """
          Generates MergeTB file for given behaviors, actors, and constraints
        """
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleHLBGeneratorMergeTB()", "Entered Class")
        json_data = request.get_json(force=True)
        script = hlb.HandleMergeTB(json_data)
        Logger.backendLog(user,"HandleHLBGeneratorMergeTB()", "Successfully created MergeTB file")
        return {'script': script}

@ns.route('/hlb/getBindingOptions')
class GetBindingOptions(Resource):

    def put(self):
        """
         Get the bindings options for an event/trigger
        """
        try:
          user = userObj.getEmailId()
          Logger.backendLog(user,"GetBindingOptions()", "Entered Class")
          data = {
            'event': [
              "tcpdump -i expeth($node) -w $file",
              "ping $node",
              "iperf -s",
              "iperf -c $node",
              "nmap $node",
              "wget $node",
              "dig $name",
              "sudo service apache2 start",
              "sudo service bind9 start"
            ],
            'trigger': [
              'pexists($action) - process exists that performs action in the binding',
              'psuccess($action) - process completed w success for the given action'
            ],
            'specialFunctions': [
              { 'name': 'expIP', 'value': 'experimental IP on the node' },
              { 'name': 'ctlIP', 'value': 'control IP on the node' },
              { 'name': 'expeth', 'value': 'experimental interface on the node' },
              { 'name': 'expIP(A)', 'value': 'experimental IP on this node leading to A' },
              { 'name': 'expeth(A)', 'value': 'experimental interface on this node leading to A' },
              { 'name': 'IP(A)', 'value': 'IP address of node A' },
              { 'name': 'pid', 'value': 'project name' },
              { 'name': 'eid', 'value': 'experiment name' },
              { 'name': 'nid', 'value': 'node name' },
              { 'name': 'epoch', 'value': 'epoch time' }
            ]
          }
          Logger.backendLog(user,"GetBindingOptions()", "Successfully Retreived Binding Options")
          return data
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")
        

@ns.route('/convert/dew1to2')
class ConvertDEW1To2(Resource):
  @api.expect(constraint_text)
  def put(self):
      """
        Parses DEW 1.0 and converts it to 2.0
      """
      try:
        json_data = request.get_json(force=True)
        user = userObj.getEmailId()
        Logger.backendLog(user,"ConvertDEW1To2()", "Entered Class")
        constraints = json_data['constraints']
        converted_constraints = dew_parser.convert_DEW_1_to_2(constraints)
        Logger.backendLog(user,"ConvertDEW1To2()", "Successfully converted constraints!")
        return {"status": "success", "parsedConstraints": converted_constraints }
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/convert/detectDEWVersion')
class DetectDEWVersion(Resource):
  @api.expect(constraint_text)
  def put(self):
      """
        Detects DEW Version based on Constraints
      """
      try:
        json_data = request.get_json(force=True)
        user = userObj.getEmailId()
        Logger.backendLog(user,"DetectDEWVersion()", "Entered Class")
        constraints = json_data['constraints']
        dewVersion = dew_parser.dew_version_detector(constraints)
        Logger.backendLog(user,"DetectDEWVersion()", "Successfully detected DEW version! DEW Version - " + str(dewVersion))
        return {"status": "success", "version": dewVersion }
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/log/user-logging')
class LogData(Resource):
  @api.expect(log_message)
  def put(self):
      """
        Logs Data
      """
      json_data = request.get_json(force=True)
      message = json_data['message'][0]
      user = userObj.getEmailId()
      logged_msg = Logger.log(user, message)
      return {"status": "success", "message": logged_msg}

@ns.route('/hlb/generateNs')
class HandleHLBGeneratorNs(Resource):
    @api.expect(ns_object)
    @api.representation('text/plain')
    def put(self):
        """
          Generates NS file for given behaviors, actors, and constraints
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleHLBGeneratorNs()", "Entered Class")
          script = hlb.HandleNS(json_data)
          Logger.backendLog(user,"HandleHLBGeneratorNs()", "Successfully generated NS file")
          return {'script': script}
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/hlb/generateBash')
class HandleHLBGeneratorBash(Resource):
    @api.expect(ns_object)
    @api.representation('text/plain')
    def put(self):
        """
          Generates BASH file for given behaviors, actors, and constraints
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleHLBGeneratorBash()", "Entered Class")
          scriptList = hlb.HandleBASH(json_data)
          bashScriptDict = {}
          Logger.backendLog(user,"HandleHLBGeneratorBash()", "Successfully generated BASH file")
          return scriptList
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route('/hlb/suggestions')
class HandleHLBSuggestions(Resource):
    @api.expect(suggestion_object)
    def put(self):
        """
          Gets suggestions for given input
        """
        try:
          # TODO : Remove globals
          globals.actors=dict()
          globals.behaviors=dict()
          globals.constraints=dict()
          globals.events=dict()
          globals.actions=dict()
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleHLBSuggestions()", "Entered Class")
          print(len(json_data['suggestion_for']))
          if json_data["type"] == "behavior":
            s, t = hlb.HandleBehaviorSuggestions(json_data["behaviors"], json_data['actors'], json_data['suggestion_for'])
            Logger.backendLog(user,"HandleHLBSuggestions()", "Successfully generated behaviour suggestions")
            return { 'suggestions': s, 'suggestion_text': t}
          elif json_data["type"] == "constraint":
            s, t = hlb.HandleConstraintSuggestions(json_data["constraints"], json_data["actors"], json_data["suggestion_for"], json_data["behaviors"])
            Logger.backendLog(user,"HandleHLBSuggestions()", "Successfully generated constraint suggestions")
            return { 'suggestions': s, 'suggestion_text': t}
          else:
            pass
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route('/hlb/dependency_graph/parse')
class HandleGraphParse(Resource):
    @api.expect(scenario_text)
    def put(self):
        """
          Parses scenario to help in building a graph
        """
        try:
          # TODO : Remove globals
          globals.actors = dict()
          globals.behaviors = dict()
          globals.constraints = dict()
          globals.events = dict()
          globals.actions = dict()
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleGraphParse()", "Entered Class")
          scenarios = json_data['scenario']
          nodes, edges = hlb.HandleGraphParse(scenarios)
          Logger.backendLog(user,"HandleGraphParse()", "Successfully built graph data")
          return {"status": "success", "nodes": nodes, "edges": edges }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route('/hlb/topology/parse')
class HandleTopologyParse(Resource):
    @api.expect(topology_text)
    def put(self):
        """
          Parses scenario to help in building a graph
        """
        try:
          # TODO : Remove globals
          globals.actors = dict()
          globals.behaviors = dict()
          globals.constraints = dict()
          globals.events = dict()
          globals.actions = dict()
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleTopologyParse()", "Entered Class")
          scenarios = json_data['scenario']
          constraints = json_data['constraints']
          actors, lans, edges = hlb.HandleTopologyParse(scenarios, constraints)
          Logger.backendLog(user,"HandleTopologyParse()", "Successfully parsed topology")
          return {"status": "success", "actors": actors, "lans": lans, "edges": edges }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route('/hlb/topology/node-rename')
class HandleTopologyNodeRename(Resource):
    @api.expect(topology_node_rename_text)
    def put(self):
        """
          Update Scenarios and Constraints on renaming node in topology
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleTopologyNodeRename()", "Entered Class")
          constraints = json_data['constraints']
          scenarios = json_data['scenarios']
          old_name = json_data['old_name']
          new_name = json_data['new_name']
          updated_constraints, updated_scenarios = hlb.HandleTopologyNodeRename(old_name, new_name, constraints, scenarios)
          Logger.backendLog(user,"HandleTopologyNodeRename()", "Successfully updated scenarios and constraints")
          return {"status": "success", "scenarios": updated_scenarios, "constraints": updated_constraints }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")


@ns.route('/hlb/topology/graph-remove')
class HandleTopologyGraphRemove(Resource):
    @api.expect(topology_remove_text)
    def put(self):
        """
          Update Scenarios and Bindings on removal of node/edge from graph 
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleTopologyGraphRemove()", "Entered Class")
          scenarios = json_data['scenarios']
          bindings = json.loads(json_data['bindings'][0])
          deleted_node = json_data['deleted_node']
          updated_scenarios, updated_bindings = hlb.HandleTopologyGraphRemove(deleted_node, scenarios, bindings)
          Logger.backendLog(user,"HandleTopologyGraphRemove()", "Successfully updated scenarios and bindings")
          return {"status": "success", "scenarios": updated_scenarios, "bindings": updated_bindings }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route('/hlb/topology-graph/generate-constraints')
class HandleTopologyGraphGenerateConstraints(Resource):
    @api.expect(topology_graph_generate_constraints)
    def put(self):
        """
          Generate Constraints from Topology Graph 
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleTopologyGraphGenerateConstraints()", "Entered Class")
          nodes = json.loads(json_data['nodes'][0])
          edges = json.loads(json_data['edges'][0])
          parameters = json.loads(json_data['parameters'][0])
          constraints = hlb.HandleTopologyGraphGenerateConstraints(nodes, edges, parameters)
          Logger.backendLog(user,"HandleTopologyGraphGenerateConstraints()", "Successfully generated constraints from topology graph")
          return {"status": "success", "constraints": constraints }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route('/hlb/dependency-graph/has-cycle')
class HandleDependencyGraphHasCycle(Resource):
    @api.expect(dependency_graph_has_cycle)
    def put(self):
        """
          Update Scenarios and Bindings by adding/removing the edge 
        """
        json_data = request.get_json(force=True)
        scenarios = json_data['scenarios']
        cycle_path = hlb.HandleDependencyGraphHasCycle(scenarios)
        return {"status": "success", "cycle_path": cycle_path}

@ns.route('/hlb/dependency-graph/node-delete')
class HandleDependencyGraphNodeDelete(Resource):
    @api.expect(dependency_graph_node_delete)
    def put(self):
        """
          Update Scenarios and Bindings by removing a node
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleDependencyGraphNodeDelete()", "Entered Class")
          scenarios = json_data['scenarios']
          bindings = json.loads(json_data['bindings'][0])
          actor = json_data['actor']
          action = json_data['action']
          updated_scenarios, updated_bindings = hlb.HandleDependencyGraphNodeDelete(actor, action, scenarios, bindings)
          Logger.backendLog(user,"HandleDependencyGraphNodeDelete()", "Successfully updated scenarios and bindings")
          return {"status": "success", "scenarios": updated_scenarios, "bindings": updated_bindings }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")


@ns.route('/hlb/dependency-graph/update-edge')
class HandleDependencyGraphUpdateEdge(Resource):
    @api.expect(dependency_graph_update_edge)
    def put(self):
        """
          Update Scenarios and Bindings by adding/removing the edge 
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleDependencyGraphUpdateEdge()", "Entered Class")
          scenarios = json_data['scenarios']
          bindings = json.loads(json_data['bindings'][0])
          actor_from = json_data['actor_from']
          action_from = json_data['action_from']
          actor_to = json_data['actor_to']
          action_to = json_data['action_to']
          update_type = json_data['update_type']
          updated_scenarios, updated_bindings, event_name, cycle_path = hlb.HandleDependencyGraphUpdateEdge(update_type, actor_from, action_from, actor_to, action_to, scenarios, bindings)
          Logger.backendLog(user,"HandleDependencyGraphUpdateEdge()", "Successfully updated scenarios and bindings")
          return {"status": "success", "scenarios": updated_scenarios, "bindings": updated_bindings, "event_name": event_name, "cycle_path": cycle_path }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route('/hlb/dependency-graph/get-node-count')
class HandleDependencyGraphGetNodeCount(Resource):
    @api.expect(dependency_graph_get_node_count)
    def put(self):
        """
          Get node count of each action in dependency graph
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleDependencyGraphGetNodeCount()", "Entered Class")
          constraints = json_data['constraints']
          scenarios = json_data['scenarios']
          bindings = json_data['bindings']
          node_count_data = hlb.HandleDependencyGraphGetNodeCount(constraints, scenarios, bindings)
          Logger.backendLog(user,"HandleDependencyGraphGetNodeCount()", "Successfully fetched node count data")
          return {"status": "success", "nodeCountData": node_count_data }
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")


@ns.route('/nlp/behavior')
class HandleNLPTranslator(Resource):

    @api.expect(nlp_text)
    def put(self):
        """
          Get the actors, behaviors and constraints for a given string of text parsed using NLP.
        """
        try:
          json_data = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleNLPTranslator()", "Entered Class")
          nlp_text = json_data['text']
          response = nlp.HandleNLPString(nlp_text)
          print(response)
          Logger.backendLog(user,"HandleNLPTranslator()", "Successfully retrieved actors, behaviors, and constraints")
          return response
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")


@ns.route("/persist/save_drive")
class HandleExperimentPushToDrive(Resource):

    @api.expect(push_to_drive_data)
    def put(self):
        """
            Save and push to drive
        """
        try:
          content = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleExperimentPushToDrive()", "Entered Class")
          userId = userObj.getUserId()
          actors = content['actors']
          constraints = content['constraints']
          behaviors = content['behaviors']
          bindings = content['bindings']
          create_new_file = content['create_new_file']
          token = content['token']
          experimentId = None
          if 'id' in content:
              experimentId = content['id']
          name = content['name']
          description = content['description']

          experiment_content = json.dumps(
              {'actors': actors, 'constraints': constraints, 'behaviors': behaviors, 'bindings': bindings})

          if experimentId is None or experimentId.strip() == '':
              try:
                  experiment = em.create_experiment(userId, experiment_content, experimentId, name, description)
                  print(experiment.to_dict())
                  res = em.push_to_drive(experiment_id=experiment.experiment_id, current_user_id=userId, token=token,
                                  create_new_file=create_new_file)
              except ValueError as e:
                  msg = {'saved': False, 'message': str(e)}
                  return msg, 403
              if res:
                  Logger.backendLog(user,"HandleExperimentPushToDrive()", "Successfully saved to Drive")
                  return {'saved': True, 'message': "Successful"}

          else:
              try:
                  flag, message, experiment = em.update_experiment(experimentId, userId, name=name, description=description,
                                                      content=experiment_content)
                  em.push_to_drive(experiment_id=experimentId, current_user_id=userId, token=token, create_new_file=create_new_file)
                  Logger.backendLog(user,"HandleExperimentPushToDrive()", "Saved to Drive with flag - " + str(flag))
                  return {'saved': flag, 'message': message}
              except ValueError as e:
                  Logger.backendLog(user,"HandleExperimentPushToDrive()", "Unable to save to Drive")
                  msg = {'saved': False, 'message': str(e)}
                  return msg, 403
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")


@ns.route('/persist/save')
class HandleExperimentSave(Resource):

    @api.expect(persist_data)
    def put(self):
        """
          Save content to database
        """
        try:
          content = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleExperimentSave()", "Entered Class")
          userId = userObj.getUserId()
          actors = content['actors']
          constraints = content['constraints']
          behaviors = content['behaviors']
          bindings = content['bindings']
          constraints = list( map(lambda x: unicodedata.normalize("NFKD", x), constraints) )
          behaviors = list( map(lambda x: unicodedata.normalize("NFKD", x), behaviors) )
          experimentId = None
          if 'id' in content:
            experimentId = content['id']
          name = content['name']
          description = content['description']
          driveId = content['driveId']
          print("driveId: ", driveId)
          experiment_content = json.dumps({'actors': actors, 'constraints': constraints, 'behaviors': behaviors, 'bindings': bindings})
          # print("Experiment : ", json.loads(json.dumps({'actors': actors, 'constraints': constraints, 'behaviors': behaviors, 'bindings': bindings},ensure_ascii=False)))

          if experimentId is None or experimentId.strip() == '':
            experiment = em.create_experiment(userId, experiment_content,experimentId,name,description)
            if experiment is not None:
                Logger.backendLog(user,"HandleExperimentSave()", "Successfully saved Experiment")
                return {'saved': True,'message':"Successful", "experiment": experiment.response_dict() }
              
          else: 
            try:
              flag , message, experiment = em.update_experiment(experimentId,userId,name=name, description=description,content=experiment_content,driveId=driveId)
              Logger.backendLog(user,"HandleExperimentSave()", "Saved Experiment with flag - " + str(flag))
              return {'saved': flag,'message':message, 'experiment': experiment.response_dict() }
            except ValueError as e:
              Logger.backendLog(user,"HandleExperimentSave()", "Unable to save experiment")
              msg = {'saved': False, 'message': str(e)}
              return msg, 403
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

         # persistence.services.sqlite3.query_db("select id from users where username="+username,one=True)
         # return 
        # print(str(content))
        # return response


@ns.route("/persist/getExperimentList")
class HandleExperimentListRetrieval(Resource):
    
    def get(self):
        """
            Retrieve content from database
        """
        try:
          token = userObj.getToken()
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleExperimentListRetrieval()", "Entered Class")
          experiment = em.get_accessible_experiments(userObj.getUserId())
          result = []
          if experiment is not None:
              result=experiment
          Logger.backendLog(user,"HandleExperimentListRetrieval()", "Successfully retrieved experiments")
          return result
        except BaseException:
            Logger.backendErrorLog(user, traceback.format_exc())
            raise Exception("Error Occured on the Server")

@ns.route("/persist/getExperimentById")
class HandleSingleExperimentRetrieval(Resource):
    @api.expect(experiment_detail)
    def post(self):
        """
            Retrieve content from database by experiment id and userId
        """
        try:
          content = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleSingleExperimentRetrieval()", "Entered Class")
          userId = userObj.getUserId()
          id1 = content['id']
          try:
              experiment = em.get_experiment(id1, userId)
              
              result = {}
              if experiment is not None:
                  r = experiment.to_dict()
                  result=json.loads(r['content'])
                  result['name'] = r['name']
                  result['description'] = r['description']
                  result['driveId'] = r['driveId']
                  Logger.backendLog(user,"HandleSingleExperimentRetrieval()", "Successfully retrieved experiment")
                  return result
          except ValueError as e:
              if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleSingleExperimentRetrieval()", "Unable to retrieve experiment")
                return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")


@ns.route("/persist/experiment/delete")
class HandleExperimentDelete(Resource):
  @api.expect(experiment_detail)
  def delete(self):
    """
      Delete experiment from database
    """
    try:
      content = request.get_json(force=True)
      user = userObj.getEmailId()
      Logger.backendLog(user,"HandleExperimentDelete()", "Entered Class")
      userId = userObj.getUserId()
      experiment_id = content['id']
      
      try:
        em.soft_delete_experiment(userId, experiment_id)
        Logger.backendLog(user,"HandleExperimentDelete()", "Successfully deleted experiment")
        return None, 204
      except ValueError as e:
        if str(e) == "Forbidden":
          Logger.backendLog(user,"HandleExperimentDelete()", "Unable to delete experiment")
          return {}, 403
    except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route("/persist/experiment/removeaccess")
class HandleExperimentAccessRemoval(Resource):
  @api.expect(remove_access)
  def delete(self):
    """
      Delete experiment from database
    """
    try:
      content = request.get_json(force=True)
      user = userObj.getEmailId()
      Logger.backendLog(user,"HandleExperimentAccessRemoval()", "Entered Class")
      userId = userObj.getUserId()
      experiment_id = content['id']
      userHandle= content['userHandle']
      try:
        em.soft_delete_access(userId, experiment_id,userHandle)
        Logger.backendLog(user,"HandleExperimentAccessRemoval()", "Successfully deleted access")
        return None, 200
      except ValueError as e:
        if str(e) == "Forbidden":
          Logger.backendLog(user,"HandleExperimentAccessRemoval()", "Unable to delete access")
          return {}, 403
    except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route("/persist/experiment/versions")
class HandleExperimentVersions(Resource):
    @api.expect(experiment_detail)
    def post(self):
        """
          Get versions of experiment from database
        """
        try:
          content = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleExperimentVersions()", "Entered Class")
          userId = userObj.getUserId()
          experiment_id = content['id']
          versions = em.get_experiment_versions(experiment_id, userId)
          try:
              Logger.backendLog(user,"HandleExperimentVersions()", "Successfully retrieved versions")
              return { "status": "success", "versions": versions}
          except ValueError as e:
              if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleExperimentVersions()", "Unable to retrieve versions")
                return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route("/export/dew")
class HandleExportToDEW(Resource):
    @api.expect(experiment_detail)
    def put(self):
        """
        Get experiment in DEW format
        """
        try:
          content = request.get_json(force=True)
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleExportToDEW()", "Entered Class")
          userId = userObj.getUserId()
          try:
              dew_content = em.dew_content(content['id'], userId)
              result = {}
              result['status'] = True
              result['dew_content'] = dew_content
              Logger.backendLog(user,"HandleExportToDEW()", "Successfully exported to DEW")
              return result, 200
          except ValueError as e:
              if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleExportToDEW()", "Unable to export to DEW")
                return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route("/persist/experiment/copy")
class HandleExperimentCopy(Resource):
  @api.expect(experiment_detail)
  def post(self):
    """
      Duplicate the experiment
    """
    try:
      content = request.get_json(force=True)
      user = userObj.getEmailId()
      Logger.backendLog(user,"HandleExperimentCopy()", "Entered Class")
      userId = userObj.getUserId()
      experiment_id = content['id']
      try:
        experiment = em.get_experiment(experiment_id, userId)
        copied_experiment = em.copy_experiment(experiment, userId).to_dict()
        result = {}
        result['status'] = True
        result['experiment_id'] = copied_experiment['id']
        Logger.backendLog(user,"HandleExperimentCopy()", "Successfully duplicated the experiment")
        return result, 201
      except ValueError as e:
        if str(e) == "Forbidden":
          Logger.backendLog(user,"HandleExperimentCopy()", "Unable to duplicate the experiment")
          return {}, 403
    except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route("/persist/experiment/grantaccess")
class HandleExperimentAccess(Resource):
  @api.expect(grantaccess)
  def post(self):
    """
     Grant experiment access
    """
    try:
      content = request.get_json(force=True)
      user = userObj.getEmailId()
      Logger.backendLog(user,"HandleExperimentAccess()", "Entered Class")
      userId = userObj.getUserId()
      userHandle = content['userHandle']
      experiment_id = content['id']
      accessLevel = content['accessLevel']
      try:
        if int(accessLevel)>0 and int(accessLevel)<=4:
          result = em.grantExperimentAccess(experiment_id, userId,userHandle,accessLevel)
        else:
          result = {'error':'Invalid Access Level'}
        Logger.backendLog(user,"HandleExperimentAccess()", "Successfully granted access. Result - " + str(result))
        return result, 200
      except ValueError as e:
        if str(e) == "Forbidden":
          Logger.backendLog(user,"HandleExperimentAccess()", "Unable to grant access")
          return {}, 403
    except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route("/persist/experiment/control")
class HandleExperimentControl(Resource):
  @api.expect(experiment_detail)
  def post(self):
    """
     Grant experiment Control
    """
    try:
      content = request.get_json(force=True)
      user = userObj.getEmailId()
      Logger.backendLog(user,"HandleExperimentControl()", "Entered Class")
      userId = userObj.getUserId()
      experiment_id = content['id']
      
      try:
        result = em.getExperimentControlInfoByUserId(experiment_id, userId)
        Logger.backendLog(user,"HandleExperimentControl()", "Granted experiment control")
        return result, 200
      except ValueError as e:
        if str(e) == "Forbidden":
          Logger.backendLog(user,"HandleExperimentControl()", "Unable to grant experiment control")
          return {}, 403
    except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/persist/getUserAccessList/')
class HandleExperimentUserControlList(Resource):
    @api.expect(userAccessListModel)
    def post(self):
      try:
        json_data = request.get_json(force=True)
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleExperimentUserControlList()", "Entered Class")
        result = em.getUserAccessList(userObj.getUserId(),json_data['experiment_id'])
        Logger.backendLog(user,"HandleExperimentUserControlList()", "Successfully retrieved user access list")
        return result
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/upload/dew')
class HandleUploadParser(Resource):

    @api.expect(upload_parser)
    def put(self):
        """
          Get the actors, behaviors and constraints for a given string of text parsed using NLP.
        """
        try:
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleUploadParser()", "Entered Class")
          uploaded_file = upload_parser.parse_args()['file']
          content = uploaded_file.read()
          x = dew_parser.get_behaviors_and_constraints(content.decode("utf-8"))

          # This section is being done to extract the bindings category as
          # only the key and values are stored in dew file

          # Creating data dictionary to send to the parser api
          data = {
              'ParseType': 'bash',
              'Scenario': x['behaviors'],
              'Constraints': [],
          }
          parsed_data = hlb.HandleParse(data)

          # copy into another variable
          bindings_copy = x['bindings']

          # define function to flatten lists
          def flatten(lst):
              lst = [a for a in lst if a is not None]
              return [item for sublist in lst for item in sublist]

          # Get all actions, events and unknowns
          all_actions = flatten([x[2] for x in parsed_data['parsedScenario']])
          all_events = flatten([x[3] for x in parsed_data['parsedScenario']])

          formatted_bindings = []
          for val in bindings_copy:
              if val[0] in all_actions:
                  formatted_bindings.append({
                      'category': 'action',
                      'key': val[0],
                      'value': val[1]
                  })
              elif val[0] in all_events:
                  formatted_bindings.append({
                      'category': 'event',
                      'key': val[0],
                      'value': val[1]
                  })
              else:
                  formatted_bindings.append({
                      'category': 'unknown',
                      'key': val[0],
                      'value': val[1]
                  })
          x['bindings'] = formatted_bindings
          Logger.backendLog(user,"HandleUploadParser()", "Successfully parsed actors, behaviors and constraints")
          return x
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/token-based-auth/create')
class HandleTokenBasedAuthCreateToken(Resource):
    @api.expect(token_data)
    def post(self):
        """
        Create token for a given experiment
        """
        try:
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleTokenBasedAuthCreateToken()", "Entered Class")
          content = request.get_json(force=True)
          experiment_id = content['experiment_id']
          access_level = content['access_level']
          creator_uid = userObj.getUserId()

          try:
            token = tm.create_token(experiment_id, access_level, creator_uid)
            Logger.backendLog(user,"HandleTokenBasedAuthCreateToken()", "Successfully created token")
            return token, 201
          except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleTokenBasedAuthCreateToken()", "Unable to create token")
              return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")


@ns.route('/token-based-auth/getTokenList')
class HandleTokenBasedAuthTokenList(Resource):
    @api.expect(tokenListModel)
    def post(self):
        """
        Create token for a given experiment
        """
        try:
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleTokenBasedAuthTokenList()", "Entered Class")
          content = request.get_json(force=True)
          experiment_id = content['experiment_id']
          creator_uid = userObj.getUserId()

          try:
              result = []
              tokenList = tm.getTokenList(experiment_id, creator_uid)
              for t in tokenList:
                  obj = {}
                  obj['token'] = t['token']
                  obj['accessLevel'] = t['access_level']
                  obj['status'] = t['active']
                  result.append(obj)
              Logger.backendLog(user,"HandleTokenBasedAuthTokenList()", "Successfully retrieved token list")
              return result, 200
          except ValueError as e:
              if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleTokenBasedAuthTokenList()", "Unable to retrieve token list")
                return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")


@ns.route('/profile/accounts/deterLab/save')
class HandleProfileDeterLabSaveAccounts(Resource):
    @api.expect(deterlab_user_details)
    def post(self):
        """
        Create token for a given experiment
        """
        try:
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleProfileDeterLabSaveAccounts()", "Entered Class")
          content = request.get_json(force=True)
          username = content['username']
          password = content['password']
          creator_uid = userObj.getUserId()
          print(creator_uid)
          try:
              result = ps.save(creator_uid, username, password)
              Logger.backendLog(user,"HandleProfileDeterLabSaveAccounts()", "Saved Account")
              return result, 200
          except ValueError as e:
              if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleProfileDeterLabSaveAccounts()", "Unable to save account")
                return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")


@ns.route('/profile/accounts/deterLab/get')
class HandleProfileDeterLabGetAccounts(Resource):
    def get(self):
        """
        Create token for a given experiment
        """
        try:
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleProfileDeterLabGetAccounts()", "Entered Class")
          creator_uid = userObj.getUserId()
          try:
              result = ps.getList(creator_uid)
              Logger.backendLog(user,"HandleProfileDeterLabGetAccounts()", "Successfully retrieved accounts")
              return result, 200
          except ValueError as e:
              if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleProfileDeterLabGetAccounts()", "Unable to retrieve accounts")
                return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/profile/accounts/deterLab/delete')
class HandleProfileDeterLabDeleteAccounts(Resource):
    def delete(self):
        """
        Create token for a given experiment
        """
        try:
          user = userObj.getEmailId()
          Logger.backendLog(user,"HandleProfileDeterLabDeleteAccounts()", "Entered Class")
          creator_uid = userObj.getUserId()
          daid = request.args.get('id')
          try:
              result = ps.delete(creator_uid,daid)
              Logger.backendLog(user,"HandleProfileDeterLabDeleteAccounts()", "Successfully deleted account")
              return result, 200
          except ValueError as e:
              if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleProfileDeterLabDeleteAccounts()", "Unable to delete account")
                return {}, 403
        except BaseException:
          Logger.backendErrorLog(user, traceback.format_exc())
          raise Exception("Error Occured on the Server")

@ns.route('/deterlab/project/exists')
class HandleDeterLabProjectExists(Resource):
    @api.expect(deterlab_project_name)
    def post(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleDeterLabProjectExists()", "Entered Class")
        content = request.get_json(force=True)
        projectName = content['projectName']
        daid = content['account_id']
        creator_uid = userObj.getUserId()

        try:
            details = ps.get(creator_uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              ssh = SSHConnection(details['username'],details['password'])
              result = ssh.isProjectExists(projectName)
            else:
              result = {'error':'username or password does not exists'}
            Logger.backendLog(user,"HandleDeterLabProjectExists()", "Checked if project exists. Result - " + str(result))
            return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleDeterLabProjectExists()", "Unable to check if project exists")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/deterlab/experiment/exists')
class HandleDeterLabExperimentExists(Resource):
    @api.expect(deterlab_experiment_details)
    def post(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleDeterLabExperimentExists()", "Entered Class")
        content = request.get_json(force=True)
        projectName = content['projectName']
        experimentName = content['experimentName']
        daid = content['account_id']
        creator_uid = userObj.getUserId()

        try:
            details = ps.get(creator_uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              ssh = SSHConnection(details['username'],details['password'])
              result = ssh.isExperimentExists(projectName,experimentName)
            else:
              result = {'error':'username or password does not exists'}
            Logger.backendLog(user,"HandleDeterLabExperimentExists()", "Checked if experiment exists. Result - " + str(result))
            return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleDeterLabExperimentExists()", "Unable to check if experiment exists")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/deter/project/getnsfile')
class HandleDeterGetNsFileContent(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleDeterGetNsFileContent()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              ssh = SSHConnection(details['username'],details['password'])
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                result = ssh.getFileContent(mapping['project_name'],mapping['experiment_name'])
              else:
                result = mapping
            else:
              result = {'error':'username or password does not exists'}
          Logger.backendLog(user,"HandleDeterGetNsFileContent()", "Retrieved file content with result - " + str(result))   
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleDeterGetNsFileContent()", "Unable to retrieve file content")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/deter/userlist')
class HandleDeterUserList(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleDeterUserList()", "Entered Class")
        uid = userObj.getUserId()
        try:
          result = ps.getUserList(uid)
          Logger.backendLog(user,"HandleDeterUserList()", "Retrieved User List with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleDeterUserList()", "Unable to retrieve User List")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/deter/project')
class HandleProjectMapping(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectMapping()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              result = dm.getMapping(details['id'],eid)
            else:
              result = {'error':'username or password doesnot exists'}
          Logger.backendLog(user,"HandleProjectMapping()", "Mapped projects with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleProjectMapping()", "Unable to map projects")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/deter/add/project/mapping')
class HandleAddProjectMapping(Resource):
    @api.expect(deterlab_experiment_mapping_details)
    def post(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleAddProjectMapping()", "Entered Class")
        content = request.get_json(force=True)
        projectName = content['projectName']
        experimentName = content['experimentName']
        eid = content['experimentId']
        daid = content['account_id']
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              experiment = em.get_experiment(eid, uid)
              script = hlb.HandleNS(json.loads(experiment.content))
              ssh = SSHConnection(details['username'],details['password'])
              result = ssh.createExperimentIfNotExistOnDeterLab(projectName,experimentName,script)
              if 'error' not in result:
                result = dm.createOrModifyMapping(details['id'],eid,projectName,experimentName)
            else:
              result = {'error':'username or password does not exists'}
          Logger.backendLog(user,"HandleAddProjectMapping()", "Added project mapping with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleAddProjectMapping()", "Unable to map projects")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")

@ns.route('/deter/project/getactivity')
class HandleGetActivity(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleGetActivity()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              ssh = SSHConnection(details['username'],details['password'])
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                result = ssh.getActivityLogOfExperiment(mapping['project_name'],mapping['experiment_name'])
              else:
                result = mapping
            else:
              result = {'error':'username or password doesnot exists'}
          Logger.backendLog(user,"HandleGetActivity()", "Retrieved Activity with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleGetActivity()", "Unable to retrieve activity")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server")      

@ns.route('/deter/project/getstatus')
class HandleGetStatus(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleGetStatus()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              ssh = SSHConnection(details['username'],details['password'])
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                result = ssh.getExperimentStatusInformation(mapping['project_name'],mapping['experiment_name'])
                #Stop experiment if running in db and experiment swapped out from deterlab
                if 'content' in result and "State:" in result['content']:
                  experiment_status = result['content'].split("\n")[1].split()[1].strip()
                  if(experiment_status == 'swapped'):
                    unique_name = mapping['experiment_name']+"_run"
                    experiment = list(em.get_experiment(eid, uid).versions)[-1]
                    transaction_id = experiment.transaction_id
                    run_status = dm.getStatus(eid, uid, unique_name)
                    if run_status == 'start':
                      dm.addLog(eid, details['id'], uid, transaction_id, unique_name, "{}", "stop", None)
              else:
                result = mapping
            else:
              result = {'error':'username or password doesnot exists'}
          Logger.backendLog(user,"HandleGetStatus()", "Retrieved status with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleGetStatus()", "Unable to retrieve status")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/deter/project/swap')
class HandleProjectSwap(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectSwap()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        swapModeString = request.args.get('mode')
        if swapModeString is None or (swapModeString.lower() != 'swapin' and swapModeString.lower() != 'swapout'):
          return "Please select a mode, either 'swapin' or 'swapout'",200
        if swapModeString.lower() == 'swapin':
          swapmode = 'in'
        else:
          swapmode = 'out'
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              ssh = SSHConnection(details['username'],details['password'])
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                result = ssh.swap(mapping['project_name'],mapping['experiment_name'],swapmode)
              else:
                result = mapping
            else:
              result = {'error':'username or password does not exists'}
          Logger.backendLog(user,"HandleProjectSwap()", "Swapped projects with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleProjectSwap()", "Unable to swap projects")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/deter/update/project/nsfile')
class HandleUpdateProjectNSFile(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleUpdateProjectNSFile()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                experiment = em.get_experiment(eid, uid)
                script = hlb.HandleNS(json.loads(experiment.content))
                ssh = SSHConnection(details['username'],details['password'])
                result = ssh.updateProjectNsfile(mapping['project_name'],mapping['experiment_name'],script)
              else:
                result = mapping
            else:
              result = {'error':'username or password does not exists'}
          Logger.backendLog(user,"HandleUpdateProjectNSFile()", "Updated project NS file with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleUpdateProjectNSFile()", "Unable to update project ns file")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/deter/project/mapping/delete')
class HandleProfileDeterLabDeleteMapping(Resource):
    def delete(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProfileDeterLabDeleteMapping()", "Entered Class")
        uid = userObj.getUserId()
        daid = request.args.get('account_id')
        eid = request.args.get('eid')
        try:
            result = {}
            if not dm.user_can(uid,eid):
              result['error'] = "User does not have access to this experiment"
            else: 
              details = ps.get(uid,daid)
              if str(details['username']).strip() !='' and str(details['password']).strip() !='':
                result = dm.deleteMapping(details['id'],eid)
              else:
                result['error'] = "username or password does not exists"
            Logger.backendLog(user,"HandleProfileDeterLabDeleteMapping()", "Deleted mapping with result - " + str(result))
            return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleProfileDeterLabDeleteMapping()", "Unable to delete mapping")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 



@ns.route('/design/experiment/slides')
class HandleExperimentSlides(Resource):
    
    @api.expect(create_slides_object)
    def post(self):
      """
          Create a new slide
      """
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleExperimentSlides(POST)", "Entered Class")
        try:
            json_data = request.get_json(force=True)
            userId = userObj.getUserId()
            experiment_id = json_data['experiment_id']
            sequence_number = json_data['sequence_number']
            slide = em.create_experiment_slide(userId, experiment_id,"{}", sequence_number)

        except ValueError as e:
                Logger.backendLog(user,"HandleExperimentSlides(POST)", "Unable to create new slide")
                msg = {'saved': False, 'message': str(e)}
                if str(e) == "Forbidden":
                    return msg, 403
                else:
                    return msg, 400
        if slide:
            Logger.backendLog(user,"HandleExperimentSlides(POST)", "Created new slide")
            return {'saved': True, 'message': "Successful", "slide": slide.to_dict()}
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 


    @api.expect(delete_slide_object)
    def delete(self):
      """
          Remove slide for an experiment
      """
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleExperimentSlides(DELETE)", "Entered Class")
        Logger.backendLog(user,"HandleExperimentSlides(DELETE)", "Exited Class")
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 
        

    @api.expect(update_slide_dew_object)
    def put(self):
      """
          Update slide contents
      """
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleExperimentSlides(PUT)", "Entered Class")
        try:
          json_data = request.get_json(force=True)
          userId = userObj.getUserId()
          experiment_id = json_data['experiment_id']
          slide_id = json_data['slide_id']
          actor_action_mapping = json_data['actor_action_mapping']
          action_binding_mapping = json_data['action_binding_mapping']
          slide = em.update_experiment_slide_mapping(userId, experiment_id,slide_id,actor_action_mapping, action_binding_mapping)
        except ValueError as e:
          msg = {'saved': False, 'message': str(e)}
          Logger.backendLog(user,"HandleExperimentSlides(PUT)", "Unable to update slide contents")
          return msg, 403
        if slide:
          Logger.backendLog(user,"HandleExperimentSlides(PUT)", "ESuccessfully updated slide contents")
          return {'saved': True, 'message': "Successful", "slide": slide.to_dict()}
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 


@ns.route('/design/experiment/slides/<experiment_id>/<slide_id>')
class HandleDeleteExperimentSlide(Resource):
    def delete(self, experiment_id, slide_id):
      """
          Delete a slide of the experiment
      """
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleDeleteExperimentSlide()", "Entered Class")
        try:
          userId = userObj.getUserId()
          status = em.delete_slide(userId, experiment_id, slide_id)

        except ValueError as e:
          Logger.backendLog(user,"HandleDeleteExperimentSlide()", "Unable to delete slide")
          msg = {'status': "Failure", 'message': str(e)}
          return msg, 403
        if status:
          Logger.backendLog(user,"HandleDeleteExperimentSlide()", "Deleted Slide")
          return None, 204
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/design/experiment/slides/<experiment_id>')
class HandleGetExperimentSlides(Resource):
    def get(self, experiment_id):
      """
          Get slides for an experiment
      """
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleGetExperimentSlides()", "Entered Class")
        try:
            userId = userObj.getUserId()
            slides = em.slides_of_experiment(userId, experiment_id)

        except ValueError as e:
          Logger.backendLog(user,"HandleGetExperimentSlides()", "Unable to get slides")
          msg = {'status': "Failure", 'message': str(e)}
          return msg, 403
        if slides:
          Logger.backendLog(user,"HandleGetExperimentSlides()", "Retrieved Slides")
          return {'status': "Successful", "slides": slides}
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/design/experiment/slides/<experiment_id>/dew')
class HandleDEWforSlides(Resource):
    def get(self, experiment_id):
      """
      Get dew from experiment slides
      """
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleDEWforSlides()", "Entered Class")
        try:
            userId = userObj.getUserId()
            behaviors, bindings = em.dew_from_slides(userId, experiment_id)
        except ValueError as e:
            Logger.backendLog(user,"HandleDEWforSlides()", "Unable to get dew from experiment slides")
            msg = {'status': 'Failure', 'message': str(e)}
            return msg, 403
        if behaviors and bindings:
            Logger.backendLog(user,"HandleDEWforSlides()", "Retrieved dew from experiment slides")
            return {
                        "status": "Successful", 
                        "behaviors": behaviors,
                        "bindings": bindings
                    }
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 
    

@ns.route('/design/experiment/slides/swap')
class HandleExperimentSlideMovement(Resource):
    
    @api.expect(move_slides_object)
    def post(self):
      """
          Takes 2 slides and swap their positions
      """
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleExperimentSlideMovement()", "Entered Class")
        try:
            json_data = request.get_json(force=True)
            userId = userObj.getUserId()
            experiment_id = json_data['experiment_id']
            first_slide_id = json_data['first_slide_id']
            second_slide_id = json_data['second_slide_id']
            status = em.swap_slides(userId, experiment_id,first_slide_id, second_slide_id)

        except ValueError as e:
                Logger.backendLog(user,"HandleExperimentSlideMovement()", "Unable to swap slides")
                msg = {'saved': False, 'message': str(e)}
                if str(e) == "Forbidden":
                    return msg, 403
                else:
                    return msg, 400
        if status:
            Logger.backendLog(user,"HandleExperimentSlideMovement()", "Successfully swapped slides")
            return {'saved': True, 'message': "Successful"}
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 


@ns.route('/deter/project/run')
class HandleProjectRunLog(Resource):
    def post(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectRunLog()", "Entered Class")
        print("In deter project run")
        content = request.get_json(force=True)
        if 'eid' not in content:
          return {"error":"eid is missing"} , 200
        if 'account_id' not in content:
          return {"error":"account_id is missing"}, 200
        label = None
        if 'label' in content:
          label = content['label']
        eid = content['eid']
        daid = content['account_id']
        data = dict()
        if 'data' in content:
          data = content['data']
        
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                experiment = list(em.get_experiment(eid, uid).versions)[-1]
                transaction_id = experiment.transaction_id
                script = hlb.HandleDAS(json.loads(experiment.content))
                
                variables = []
                variable_list = []
                flag = True
                if label is not None:
                  for x in script:
                    if x['label'] == label:
                      variable_list += x['variables']
                      run_content = x['run']['content']
                      flag = False
                      break
                if flag:
                  r = []
                  for x in script:
                    l = {}
                    v = []
                    l['label'] = x['label']
                    v = v+x['variables']
                    l['variable'] = v
                    r.append(l)
                  return {"error":"Please select label","labels":r}, 200

                if len(variable_list) != 0:
                  for x in variable_list:
                    if x['variable'] in data:
                      variables.append(data[x['variable']])
                  if len(variables) != len(variable_list):
                    result['error'] = "Parameters are missing" 
                    result['label'] = {'label':label,'variable':variable_list}
                if 'error' not in result:
                    unique_name = mapping['experiment_name']+"_run"
                    print("Unique name ",unique_name)
                    status = dm.getStatus(eid, uid, unique_name)
                    print("Status ", status)
                    if status == "start":
                        result['success'] = False
                        print("Exp already running")
                        result = {"error":"Experiment is running already and must be stopped first"}
                    else:
                        ssh = SSHConnection(details['username'],details['password'])
                        result_log = ssh.runFile(mapping['project_name'],mapping['experiment_name'],run_content,variables, unique_name, "start")
                        print("Result log ", result_log)
                        if 'error' not in result_log:
                            variable_data = None
                            if len(variables)!=0:
                                variable_data = json.dumps(data)
                            dm.addLog(eid, details['id'], uid, transaction_id, unique_name, variable_data,"start", run_content)
                            result['success'] = True
                        else:
                            result = result_log
              else:
                result = mapping
            else:
              result = {'error':'username or password does not exists'}
          Logger.backendLog(user,"HandleProjectRunLog()", "Ran log with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleProjectRunLog()", "Unable to run log")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/deter/project/stop')
class HandleProjectStopLog(Resource):
    def post(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectStopLog()", "Entered Class")
        print("In deter project stop")
        content = request.get_json(force=True)

        print("Content is ", content)
        if 'eid' not in content:
          return {"error":"eid is missing"} , 200

        if 'account_id' not in content:
          return {"error":"account_id is missing"}, 200

        label = None
        if 'label' in content:
          label = content['label']
        eid = content['eid']
        daid = content['account_id']
        data = dict()
        if 'data' in content:
          data = content['data']
        
        uid = userObj.getUserId()
        try:
          result = {}

          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                experiment = list(em.get_experiment(eid, uid).versions)[-1]
                transaction_id = experiment.transaction_id
                script = hlb.HandleDAS(json.loads(experiment.content))
                
                variables = []
                variable_list = []
                flag = True
                if label is not None:
                    for x in script:
                        if x['label'] == label:
                            variable_list += x['variables']
                            run_content = x['clean']['content']
                            print(run_content)
                            flag = False
                            break
                if flag:
                  r = []
                  for x in script:
                    l = {}
                    v = []
                    l['label'] = x['label']
                    v = v+x['variables']
                    l['variable'] = v
                    r.append(l)
                  return {"error":"Please select label","labels":r}, 200


              unique_name = mapping['experiment_name']+"_run"
              print("Unique name ",unique_name)
              status = dm.getStatus(eid, uid, unique_name)
              print("Status ", status)
              if status == "stop":
                  result['success'] = False
                  print("Exp already stopped")
                  result = {"error":"Experiment was already stopped"}
              else:
                  print("Will try to stop this experiment")
                  ssh = SSHConnection(details['username'],details['password'])
                  run_logs = ssh.getRunFile(unique_name, 0, 5)
                  dm.updateRunLogLogs(eid, uid, unique_name, json.dumps(run_logs, separators=(',', ':')))
                  print("Now running our file")
                  result_log = ssh.runFile(mapping['project_name'],mapping['experiment_name'],run_content,variables, unique_name, "stop")
                  print("Result log ", result_log)
                  if 'error' not in result_log:
                      variable_data = None
                      if len(variables)!=0:
                          variable_data = json.dumps(data)
                      dm.addLog(eid, details['id'], uid, transaction_id, unique_name, variable_data, "stop", None)
                      result['success'] = True
                  else:
                      result = result_log
                      print(result)
            else:
              result = {'error':'username or password does not exists'}
          Logger.backendLog(user,"HandleProjectStopLog()", "Stopped log with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleProjectStopLog()", "Unable to stop log")
                return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/deter/project/getRunStatus')
class HandleProjectGetRunStatus(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectGetRunStatus()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                unique_name = mapping['experiment_name']+"_run"
                print("Unique name ",unique_name)
                status = dm.getStatus(eid, uid, unique_name)
                result['success'] = True
                result['status'] = status
              else:
                result = mapping
            else:
              result = {'error':'username or password does not exists'}
          Logger.backendLog(user,"HandleProjectGetRunStatus()", "Got run status - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
              Logger.backendLog(user,"HandleProjectGetRunStatus()", "Unable to get run status")
              return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/deter/project/run/get')
class HandleProjectGetLog(Resource):
    def post(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectGetLog()", "Entered Class")
        content = request.get_json(force=True)
        if 'rid' not in content:
          return {"error":"rid is missing"} , 200
        if 'account_id' not in content:
          return {"error":"account_id is missing"}, 200
        if 'eid' not in content:
          return {"error":"eid is missing"} , 200
        rid = content['rid']
        daid = content['account_id']
        eid = content['eid']
        rsid = content.get('rsid', None)
        # start index
        s = 0
        if 's' in content:
          s = int(content['s'])
        # batch size
        b = 5
        if 'b' in content:
          b = int(content['b'])
          
        uid = userObj.getUserId()
        try:
          result = {}
          version_id = dm.getVersion(rid,uid,daid)
          if version_id is None:
            result['error'] = 'User doesnot have access to this script'
          else:
            print("rsid")
            if rsid != None:
              print("----In")
              result = dm.getLogLogs(eid, uid, version_id.unique_name, rsid)
              print(result)
              if result:
                result = json.loads(result)
              else:
                result = {}
               #print(result)
            else:
              details = ps.get(uid,daid)
              if str(details['username']).strip() !='' and str(details['password']).strip() !='':
                ssh = SSHConnection(details['username'],details['password'])
                result = ssh.getRunFile(version_id.unique_name,s,b)
                if(dm.getStatus(eid, uid, version_id.unique_name) != 'stop'):
                  dm.updateRunLogLogs(eid, uid, version_id.unique_name, json.dumps(result, separators=(',', ':')))
              else:
                result = {'error':'username or password doesnot exists'}
          Logger.backendLog(user,"HandleProjectGetLog()", "Retrieved log with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleProjectGetLog()", "Unable to get log")
                return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 

@ns.route('/deter/project/run/script')
class HandleProjectGetRunScript(Resource):
    def post(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectGetRunScript()", "Entered Class")
        content = request.get_json(force=True)
        if 'rid' not in content:
          return {"error":"rid is missing"} , 200
        if 'account_id' not in content:
          return {"error":"account_id is missing"}, 200
        if 'eid' not in content:
          return {"error":"eid is missing"} , 200
        if 'rsid' not in content:
          return {"error":"rsid is missing"} , 200
        rid = content['rid']
        daid = content['account_id']
        eid = content['eid']
        rsid = content['rsid']
          
        uid = userObj.getUserId()
        try:
          result = {}
          version_id = dm.getVersion(rid,uid,daid)
          if version_id is None:
            result['error'] = 'User doesnot have access to this script'
          else:
            print("rsid")
            print("----In")
            result['data'] = dm.getRunScript(eid, uid, version_id.unique_name, rsid)
            print(result)
          
          Logger.backendLog(user,"HandleProjectGetRunScript()", "Retrieved run script with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleProjectGetRunScript()", "Unable to get run script")
                return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 


@ns.route('/deter/project/run/logs')
class HandleProjectGetRunLogs(Resource):
    def get(self):
      try:
        user = userObj.getEmailId()
        Logger.backendLog(user,"HandleProjectGetRunLogs()", "Entered Class")
        eid = request.args.get('eid')
        daid = request.args.get('account_id')
        uid = userObj.getUserId()
        try:
          result = {}
          if not dm.user_can(uid,eid):
            result['error'] = "User does not have access to this experiment"
          else: 
            details = ps.get(uid,daid)
            if str(details['username']).strip() !='' and str(details['password']).strip() !='':
              mapping = dm.getMapping(details['id'],eid)
              if 'error' not in mapping:
                result['logs'] = dm.getLogs(eid, details['id'], uid)
              else:
                result = mapping
            else:
              result = {'error':'username or password doesnot exists'}
          Logger.backendLog(user,"HandleProjectGetRunLogs()", "Retrieved run logs with result - " + str(result))
          return result, 200
        except ValueError as e:
            if str(e) == "Forbidden":
                Logger.backendLog(user,"HandleProjectGetRunLogs()", "Unable to get run logs")
                return {}, 403
      except BaseException:
        Logger.backendErrorLog(user, traceback.format_exc())
        raise Exception("Error Occured on the Server") 
