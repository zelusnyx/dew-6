"""Create access_control table

Revision ID: f09cc632345b
Revises: d2c3d5d4573e
Create Date: 2020-03-11 12:02:22.893792

"""
import sys
from alembic import op
import sqlalchemy as sa
sys.path.append('./utilities')

from access_control_enum import AccessControlEnum
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'f09cc632345b'
down_revision = 'a60194139bb9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'access_control',
    	sa.Column('uid',sa.String(255),sa.ForeignKey('user.uid'),primary_key=True),
    	sa.Column('experiment_id',sa.Integer, sa.ForeignKey('experiment.experiment_id'),primary_key=True),
    	sa.Column('access_level',sa.Integer, nullable=False),
    	sa.Column('created_at', sa.DateTime,default=datetime.utcnow),
      	sa.Column('updated_at', sa.DateTime,onupdate=datetime.utcnow),
    	sa.Column('expiry_date',sa.DateTime,nullable=False),
    	sa.Column('creator', sa.String(255), sa.ForeignKey('user.uid')),
    	sa.Column('last_updated_by_user', sa.String(255), sa.ForeignKey('user.uid'))
    )


def downgrade():
    op.drop_table('access_control')
