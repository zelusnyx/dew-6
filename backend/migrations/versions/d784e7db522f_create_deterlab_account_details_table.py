"""create deterlab_account_details table

Revision ID: d784e7db522f
Revises: 5552575368f9
Create Date: 2020-12-30 10:43:59.345673

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'd784e7db522f'
down_revision = '5552575368f9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'deterlab_account_details',
    	sa.Column('daid', sa.Integer, primary_key=True),
    	sa.Column('uid', sa.String(255), nullable=False),
    	sa.Column('username',sa.String(255), nullable=False),
    	sa.Column('password',sa.String(255),nullable=False,),
    	sa.Column('created_at',sa.DateTime, nullable=False,default=datetime.utcnow),
    	sa.Column('updated_at',sa.DateTime, onupdate=datetime.utcnow),
    	sa.Column('last_login_time',sa.DateTime),
    	sa.Column('isdeleted',sa.Boolean,nullable=False,default=False),
    )


def downgrade():
    op.drop_table('deterlab_account_details')
