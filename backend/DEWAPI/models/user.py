from extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'user'

    uid = db.Column(db.String, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String, nullable=False)
    username = db.Column(db.String, nullable=False)
    access_token = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    drive_folder_id = db.Column(db.String,nullable=True)
    # last_login_time = db.Column(db.DateTime)
    # last_login_ip = db.Column(db.String)
    # salt = db.Column(db.String)
    # password_digest = db.Column(db.String)
    # default_experiment_id = db.Column(db.Integer, nullable=True)

    # default_experiment = db.relationship('Experiment', backref=db.backref('user', lazy=True))

    def to_dict(self):
        return {
            'uid': self.uid,
            'email': self.email,
            'name': self.name,
            'username': self.username,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'access_token': self.access_token
            }