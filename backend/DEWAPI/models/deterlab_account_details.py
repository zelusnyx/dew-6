from extensions import db
from datetime import datetime


class DeterlabAccountDetails(db.Model):
    __tablename__ = 'deterlab_account_details'

    daid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    uid = db.Column(db.String, nullable=False)
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login_time = db.Column(db.DateTime)
    isdeleted = db.Column(db.Boolean)

    def to_dict(self):
        return {
            'daid': self.daid,
            'uid': self.uid,
            'username': self.username,
            'password': self.password,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'last_login_time': self.last_login_time,
            'isdeleted': self.isdeleted
            }
