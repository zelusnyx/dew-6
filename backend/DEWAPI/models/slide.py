from extensions import db
from datetime import datetime
from hlb_parser import HLBParser

import json

class Slide(db.Model):
	__tablename__ = 'experiment_slides'
	
	slide_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
	experiment_id = db.Column(db.Integer,db.ForeignKey('experiment.experiment_id'))
	sequence_number = db.Column(db.Integer,default=1,nullable=False)
	actor_action_mapping = db.Column(db.Text)
	action_binding_mapping = db.Column(db.Text)
	action_events_mapping = db.Column(db.Text)
	created_at = db.Column(db.DateTime,nullable=False,default=datetime.utcnow)
	updated_at = db.Column(db.DateTime,onupdate=datetime.utcnow, default=datetime.utcnow)

	def to_dict(self):
		return {
			'slide_id' : self.slide_id,
			'experiment_id': self.experiment_id,
			'sequence_number': self.sequence_number,
			'actor_action_mapping': self.actor_action_mapping,
			'action_binding_mapping': self.action_binding_mapping,
			'action_events_mapping': self.action_events_mapping,
			'created_at': self.created_at,
			'updated_at': self.updated_at
		}

	def behavior_string(self):
		mapping = json.loads(self.actor_action_mapping)
		if self.action_events_mapping is None:
			self.action_events_mapping = "{}"
		events = json.loads(self.action_events_mapping)
		dew_array = []
		for actor in mapping:
			actor_events = { "t_events": None, "e_events": None }
			if mapping[actor] in events:
				actor_events = events[mapping[actor]]
			dew_string = ""
			if actor_events["t_events"] != None:
				dew_string += "when " + ','.join(actor_events["t_events"]) + " "
			dew_string += str(actor) + " " + str(mapping[actor])
			if actor_events["e_events"] != None:
				dew_string += " emit " + ','.join(actor_events["e_events"])
			dew_string += "\n"
			dew_array.append(dew_string)
		return dew_array

	def bindings(self):
		if(self.action_binding_mapping is None):
			self.action_binding_mapping = "{}"
		mapping = json.loads(self.action_binding_mapping)
		binding_arr = []
		for action in mapping:
			binding_arr.append({
				"key": action,
				"category": "action",
				"value": mapping[action]
			})
		return binding_arr

	@classmethod
	def get_from_dew(self, experiment_id, sequence_number, scenario, binding):
		parser = HLBParser([])
		_t, v, _h = parser.extract_partial(scenario)
		print("scenario is ", v)
		actor_action_mapping = {}
		action_binding_mapping = {}
		action_events_mapping = {}
 
		actor_action_mapping[v['actors'][0]] = v['action']
		action_events_mapping[v['action']] = { 't_events': v['t_events'], 'e_events': v['e_events'] }
		action_binding_mapping[v['action']] = [b['value'] for b in binding if b['key'] == v['action'] and b['category'] == 'action'][0]
		return Slide(experiment_id=experiment_id,
			sequence_number=sequence_number,
			actor_action_mapping=json.dumps(actor_action_mapping),
			action_binding_mapping=json.dumps(action_binding_mapping),
			action_events_mapping=json.dumps(action_events_mapping)
		)
		
