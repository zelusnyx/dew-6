from extensions import db
from datetime import datetime
import uuid

class AuthToken(db.Model):
    __tablename__ = 'auth_tokens'

    experiment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    token = db.Column(db.String, primary_key=True)
    created_at = db.Column(db.DateTime,nullable=False,default=datetime.utcnow)
    access_level = db.Column(db.String, nullable=False)
    active = db.Column(db.Boolean,default=True)
    updated_at = db.Column(db.DateTime,onupdate=datetime.utcnow, default=datetime.utcnow)
    creator_uid = db.Column(db.String, db.ForeignKey('user.uid'), nullable=False)

    def __init__(self, experiment_id, creator_uid, token, access_level, active):
        super().__init__()
        self.experiment_id = experiment_id
        self.creator_uid = creator_uid
        self.token = token
        self.access_level = access_level
        self.active = active
    

    def to_dict(self):
        return {
            'experiment_id': self.experiment_id,
            'creator_uid': self.creator_uid,
            'token': self.token,
            'access_level': self.access_level,
            'active': self.active
        }
