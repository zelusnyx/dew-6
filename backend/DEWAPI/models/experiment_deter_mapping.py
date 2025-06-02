from extensions import db
from datetime import datetime


class DeterLabExperimentMapping(db.Model):
    __tablename__ = 'deterlab_userid_experiment_mapping'

    mid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    daid = db.Column(db.Integer,nullable=False)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.experiment_id'))
    project_name = db.Column(db.String(255), nullable=False)
    experiment_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    isdeleted = db.Column(db.Boolean,nullable=False)

    def to_dict(self):
        return {
            'mid':self.mid,
            'daid': self.daid,
            'experiment_id': self.experiment_id,
            'project_name': self.project_name,
            'experiment_name': self.experiment_name,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'isdeleted': self.isdeleted
            }