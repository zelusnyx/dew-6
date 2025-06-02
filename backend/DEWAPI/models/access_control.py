from extensions import db
from utilities.access_control_enum import AccessControlEnum
from datetime import datetime

class AccessControl(db.Model):
    __tablename__ = 'access_control'

    uid = db.Column(db.String, db.ForeignKey('user.uid'), primary_key=True)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.experiment_id'), primary_key=True)
    access_level = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime,default=datetime.utcnow)
    updated_at = db.Column(db.DateTime,onupdate=datetime.utcnow, default=datetime.utcnow)
    expiry_date = db.Column(db.DateTime, nullable=False)
    creator = db.Column(db.String, db.ForeignKey('user.uid'), nullable=False)
    last_updated_by_user = db.Column(db.String, db.ForeignKey('user.uid'), nullable=False)

    def to_dict(self):
        return{
            'uid': self.uid,
            'experiment_id': self.experiment_id,
            'access_level': self.access_level,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'expiry_date': self.expiry_date,
            'creator': self.creator,
            'last_updated_by_user': self.last_updated_by_user
        }
    
    
    def __init__(self, uid, experiment_id, access_level, expiry_date, creator):
        super().__init__()
        self.uid = uid
        self.experiment_id = experiment_id
        self.access_level = access_level
        self.expiry_date = expiry_date
        self.creator = creator
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.last_updated_by_user = creator
