"""create deterlab_run_script_log table

Revision ID: f498261119e5
Revises: d784e7db522f
Create Date: 2021-01-06 00:30:16.757279

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'f498261119e5'
down_revision = 'd784e7db522f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'deterlab_run_script_log',
    	sa.Column('rsid', sa.Integer, primary_key=True),
    	sa.Column('eid', sa.Integer, nullable=False),
    	sa.Column('daid', sa.Integer, nullable=False),
    	sa.Column('uid', sa.String(255), nullable=False),
    	sa.Column('unique_name',sa.Text, nullable=False),
    	sa.Column('version_id',sa.Integer, nullable=False),
    	sa.Column('created_at',sa.DateTime, nullable=False,default=datetime.utcnow),
    	sa.Column('updated_at',sa.DateTime, onupdate=datetime.utcnow),
    	sa.Column('isdeleted',sa.Boolean,nullable=False,default=False),
    )


def downgrade():
    op.drop_table('deterlab_run_script_log')
