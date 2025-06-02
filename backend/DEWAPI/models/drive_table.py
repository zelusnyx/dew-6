from extensions import db
from datetime import datetime
import uuid

class DriveTable(db.Model):
    __tablename__ = 'drive_table'

    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.experiment_id'), nullable=False, primary_key=True)
    uid = db.Column(db.String, db.ForeignKey('user.uid'), nullable=False, primary_key=True)
    driveFileId = db.Column(db.String, nullable=False, primary_key=True)
    file_type=db.Column(db.String,nullable=False)

    def __init__(self, experiment_id, uid, drive_file_id, file_type):
        super().__init__()
        self.experiment_id = experiment_id
        self.uid = uid
        self.driveFileId = drive_file_id
        self.file_type = file_type


