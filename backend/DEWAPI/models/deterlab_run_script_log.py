from extensions import db
from datetime import datetime


class DeterlabRunScriptLogs(db.Model):
    __tablename__ = 'deterlab_run_script_log'

    rsid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    daid = db.Column(db.Integer, nullable=False)
    eid = db.Column(db.Integer, nullable=False)
    uid = db.Column(db.String, nullable=False)
    run_variable_value = db.Column(db.String, nullable=True)
    unique_name = db.Column(db.Text, nullable=False)
    version_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    isdeleted = db.Column(db.Boolean)
    action = db.Column(db.String)
    logs = db.Column(db.String, nullable=True)
    run_script = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            'rsid': self.rsid,
            'eid': self.eid,
            'daid': self.daid,
            'uid': self.uid,
            'run_variable_value':self.run_variable_value,
            'unique_name': self.unique_name,
            'version_id': self.version_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'isdeleted': self.isdeleted,
            'action': self.action,
            'logs': self.logs,
            'run_script': self.run_script
            }
