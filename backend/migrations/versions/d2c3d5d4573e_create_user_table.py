"""Create user table

Revision ID: d2c3d5d4573e
Revises: a60194139bb9
Create Date: 2020-03-11 12:02:13.387599

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'd2c3d5d4573e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'user',
    	sa.Column('uid', sa.String(255), primary_key=True),
    	sa.Column('email',sa.String(255), nullable=False),
    	sa.Column('name',sa.String(255), nullable=False),
    	sa.Column('username',sa.String(255), nullable=False, unique=True),
    	sa.Column('access_token',sa.String(255)),
    	sa.Column('created_at',sa.DateTime, nullable=False,default=datetime.utcnow),
    	sa.Column('updated_at',sa.DateTime, onupdate=datetime.utcnow),
    	sa.Column('last_login_time',sa.DateTime),
    	sa.Column('last_login_ip',sa.String(255)),
    	sa.Column('salt',sa.String(255)),
    	sa.Column('password_digest',sa.String(255)),
    	# sa.Column('default_experiment_id',sa.Integer, sa.ForeignKey('experiment.experiment_id'))
    )


def downgrade():
    op.drop_table('user')
