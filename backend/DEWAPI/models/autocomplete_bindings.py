from extensions import db
from datetime import datetime
import uuid

class AutocompleteBindings(db.Model):
    __tablename__ = 'autocomplete_bindings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    command = db.Column(db.String, nullable=False)
    active = db.Column(db.Boolean, default=True)

    def __init__(self, p_id, command, active):
        super().__init__()
        self.id = p_id
        self.command = command
        self.active = active
    

    def to_dict(self):
        return {
            'id': self.id,
            'command': self.command,
            'active': self.active,
            'access_level': self.access_level,
            'active': self.active
        }
