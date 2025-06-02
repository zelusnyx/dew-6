from extensions import db
from datetime import datetime
from sqlalchemy_continuum.plugins import FlaskPlugin
from sqlalchemy_continuum import make_versioned

make_versioned( user_cls=None)

class Experiment(db.Model):
    __versioned__ = {}

    experiment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String, default='untitled')
    description = db.Column(db.Text)
    # nlp_content = db.Column(db.Text)
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime,nullable=False,default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime,onupdate=datetime.utcnow, default=datetime.utcnow)
    uid = db.Column(db.String, db.ForeignKey('user.uid'))
    driveId = db.Column(db.String)


    def to_dict(self):
        return {
            'name': self.name,
            'id': self.experiment_id,
            'description': self.description,
            # 'nlp_content': self.nlp_content,
            'content': self.content,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'deleted_at': self.deleted_at,
            'uid': self.uid,
            'driveId': self.driveId,
            }

    def response_dict(self):
        return {
            'name': self.name,
            'id': self.experiment_id,
            'description': self.description,
            # 'nlp_content': self.nlp_content,
            'content': self.content,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }


    def __init__(self, content, uid, description='', name=''):
        super().__init__()
        self.content = content
        self.uid = uid
        self.description = description
        self.name = name
