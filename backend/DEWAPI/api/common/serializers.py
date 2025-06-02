from flask_restplus import fields
from DEWAPI.api.restplus import api

nlp_text = api.model('NLP input', {
  'text': fields.String(description='The text to be parsed by the NLP')
})

binding_val = api.model('binding', {
  'category': fields.String(required=True),
  'key': fields.String(required=True),
  'value': fields.String(required=True)
})

ns_object = api.model('NS object', {
  'actors': fields.List(fields.String, description="Actors involved"),
  'behaviors': fields.List(fields.String, description="Behaviors"),
  'constraints': fields.List(fields.String, description="Constraints"),
  'bindings': fields.Nested(binding_val, as_list=True)
})

parse_request = api.model('Parser object', {
  'ParseType': fields.String(enum=['bash', 'magi', 'go'], description="type of script to be parsed"),
  'Scenario': fields.List(fields.String, description="Scenario"),
  'Constraints': fields.List(fields.String, description="Constraints")
})

translate_request = api.model('Translate request', {
  'Script': fields.String(description="Content of the script to be translated, script type could be bash, magi, and go")
})

suggestion_object = api.model('Suggestion v1 request', {
  'type': fields.String(description="Type of suggestions required",required=True, enum=['behavior', 'constraint']),
  'suggestion_for': fields.String(description="Partial string for which suggestion is required"),
  'behaviors': fields.List(fields.String, description="List of behaviors to make suggestions"),
  'constraints': fields.List(fields.String, description="List of constraints to make suggestions"),
  'actors': fields.List(fields.String, description="List of actors to make suggestions")
})

persist_data = api.model('Save request', {
  'name':fields.String(description="Name of experiment", required=True),
  'id':fields.String(description="Id of experiment", required=False),
  'description':fields.String(description="Description of experiment", required=True),
  'behaviors': fields.List(fields.String, description="List of behaviors", required=True),
  'constraints': fields.List(fields.String, description="List of constraints", required=True),
  'actors': fields.List(fields.String, description="List of actors", required=True),
  'bindings': fields.Nested(binding_val, as_list=True),
  'driveId': fields.String(description="File id of Google drive", required=False),
  })

push_to_drive_data = api.model('Save to drive', {
  'name': fields.String(description="Name of experiment", required=True),
  'id': fields.String(description="Id of experiment", required=False),
  'description':fields.String(description="Description of experiment", required=True),
  'behaviors': fields.List(fields.String, description="List of behaviors", required=True),
  'constraints': fields.List(fields.String, description="List of constraints", required=True),
  'actors': fields.List(fields.String, description="List of actors", required=True),
  'bindings': fields.Nested(binding_val, as_list=True),
  'create_new_file': fields.Boolean(description="Create a new file in drive", default=False),
  'token': fields.String(description='Token used to authorize google apis', required=True)
  })

scenario_text = api.model('Graph parsing', {
  'scenario': fields.List(fields.String, description="Scenario of the experiment",required=True)
})

constraint_text = api.model('Constraint parsing', {
  'constraints': fields.List(fields.String, description="Constraints of the experiment",required=True)
})

log_message = api.model('Constraint parsing', {
  'message': fields.List(fields.String, description="Log Message",required=True)
})

topology_text = api.model('Toplogy parsing', {
  'scenario': fields.List(fields.String,description="Scenario of the experiment",required=True),
  'constraints': fields.List(fields.String,description="Constraints of the experiment",required=True)
  })

topology_remove_text = api.model('Toplogy remove', {
  'scenarios': fields.List(fields.String,description="Scenario of the experiment",required=True),
  'bindings': fields.List(fields.String,description="Bindings of the experiment",required=True),
  'deleted_node': fields.String(description="Deleted node label of the graph",required=True),
  })

topology_node_rename_text = api.model('Toplogy node rename', {
  'constraints': fields.List(fields.String,description="Constraints of the experiment",required=True),
  'scenarios': fields.List(fields.String,description="Scenario of the experiment",required=True),
  'old_name': fields.String(description="Old name of the node",required=True),
  'new_name': fields.String(description="New name of the node",required=True),
  })

topology_graph_generate_constraints = api.model('Toplogy graph generate constraints', {
  'nodes': fields.List(fields.String,description="Nodes of graphs",required=True),
  'edges': fields.List(fields.String,description="Edges of graphs",required=True),
  'parameters': fields.List(fields.String,description="Parameters of nodes and edges",required=True),
  })


dependency_graph_has_cycle = api.model('Check if there exists a cycle in the given scenario', {
  'scenarios': fields.List(fields.String,description="Scenario of the experiment",required=True),
  })

dependency_graph_node_delete = api.model('Dependency graph delete node', {
  'scenarios': fields.List(fields.String,description="Scenario of the experiment",required=True),
  'bindings': fields.List(fields.String,description="Bindings of the experiment",required=True),
  'actor': fields.String(description="Name of actor which is deleted",required=True),
  'action': fields.String(description="Name of action which is deleted",required=True),
  })

dependency_graph_update_edge = api.model('Dependency graph update edge', {
  'scenarios': fields.List(fields.String,description="Scenario of the experiment",required=True),
  'bindings': fields.List(fields.String,description="Bindings of the experiment",required=True),
  'actor_from': fields.String(description="Name of actor from which the event is emitted",required=True),
  'action_from': fields.String(description="Name of action from which the event is emitted",required=True),
  'actor_to': fields.String(description="Name of actor to which the event is emitted",required=True),
  'action_to': fields.String(description="Name of action to which the event is emitted",required=True),
  'update_type': fields.String(description="INSERT/REMOVE; Update the graph by adding/deleting and edge",required=True),
  })

dependency_graph_get_node_count = api.model('Get node count of each action in Dependency graph', {
  'constraints': fields.List(fields.String,description="Constraints of the experiment",required=True),
  'scenarios': fields.List(fields.String,description="Scenario of the experiment",required=True),
  'bindings': fields.Nested(binding_val, as_list=True)
  })

experiment_detail = api.model('get experiment request', {
  'id':fields.String(description="Id of experiment", required=True)
  })

grantaccess = api.model('Grant experiment access', {
  'userHandle': fields.String(description="user id", required=True),
  'id':fields.String(description="Id of experiment", required=True),
  'accessLevel':fields.String(description="Access level read,write or manage", required=True)
  })

remove_access = api.model('Remove experiment access', {
  'userHandle': fields.String(description="user id", required=True),
  'id':fields.String(description="Id of experiment", required=True)
  })
suggestion_v2_object = api.model('Suggestion v2 request',{
  'username': fields.String(description="Username", required=True),
  'type': fields.String(description="Type of suggestions required",required=True, enum=['behavior', 'constraint']),
  'suggestion_for': fields.String(description="Partial string for which suggestion is required")
})

user_object = api.model('User information request',{
  'token': fields.String(description="token", required=True),
})
user_handle = api.model('User handle verification',{
  'handle': fields.String(description="handle", required=True),
})

register_user_handle = api.model('Register a new user ',{
  'token': fields.String(description="token", required=True),
  'handle': fields.String(description="handle", required=True),
})

token_data = api.model('Create token object',{
  'experiment_id': fields.String(description="experiment id for which the token is to be created", required=True),
  'access_level': fields.String(description="Access level allowed", required=True, enum=['read', 'write'])
})

tokenListModel = api.model('Get List of all tokens',{
  'experiment_id': fields.String(description="experiment id for which the token is to be created", required=True)
})

userAccessListModel = api.model('Get List of all access',{
  'experiment_id': fields.String(description="experiment id", required=True)
})

token_data_small = api.model('Toggle token object',{
  'experiment_id': fields.String(description="experiment id for which the token is to be created", required=True),
  'token': fields.String(description="Auth token to be toggled", required=True)
})

deterlab_user_details = api.model('Deter Lab user details', {
  'username': fields.String(description="Deter Lab User Name", required=True),
  'password': fields.String(description="Deter Lab Password", required=True)
})

deterlab_project_name = api.model('Deter Lab project name', {
  'projectName': fields.String(description="Deter Lab Project Name", required=True),
  'account_id': fields.String(description="Deter Lab Account Id", required=True)
})

deterlab_experiment_details = api.model('Deter Lab Experiment Details', {
  'projectName': fields.String(description="Deter Lab Project Name", required=True),
  'experimentName': fields.String(description="Deter Lab Experiment Name", required=True),
  'account_id': fields.String(description="Deter Lab Account Id", required=True)
})

deterlab_experiment_mapping_details = api.model('Deter Lab Experiment Mapping Details', {
  'projectName': fields.String(description="Deter Lab Project Name", required=True),
  'experimentName': fields.String(description="Deter Lab Experiment Name", required=True),
  'experimentId': fields.String(description="DEW Experiment Id", required=True),
  'account_id': fields.String(description="Deter Lab Account Id", required=True)
})

create_slides_object = api.model('Create Experiment slide', {
    'experiment_id': fields.String(description="Experiment id", required=True),
    'sequence_number': fields.Integer(description="Sequence number of slide", required=True)
  })

delete_slide_object = api.model('Delete Experiment slide', {
  'slide_id': fields.String(description="Slide id", required=True),
  'experiment_id': fields.String(description="Experiment id", required=True),
  })

update_slide_dew_object = api.model('Update Experiment slide dew', {
  'slide_id': fields.String(description="Slide id", required=True),
  'experiment_id': fields.String(description="Experiment id", required=True),
  'actor_action_mapping': fields.String(description="Actor action mapping", required=True),
  'action_binding_mapping': fields.String(description="Action to binding mapping", required=True)
  })

move_slides_object = api.model('Swap slide positions', {
  'experiment_id': fields.String(description="Experiment id", required=True),
  'first_slide_id': fields.String(description="First Slide id", required=True),
  'second_slide_id': fields.String(description="Second Slide id", required=True),
  })

uid_header_parser = api.parser()
uid_header_parser.add_argument('X-user-id',location='headers')

experiment_update_by_token = api.model('Experiment object update by token', {
  'name':fields.String(description="Name of experiment", required=True),
  'description':fields.String(description="Description of experiment", required=True),
  'behaviors': fields.List(fields.String, description="List of behaviors",required=True),
  'constraints': fields.List(fields.String, description="List of constraints",required=True),
  'actors': fields.List(fields.String, description="List of actors",required=True),
  'bindings': fields.List(fields.String, description="List of bindings",required=True)
})
