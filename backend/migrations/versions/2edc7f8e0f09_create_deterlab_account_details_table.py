"""create deterlab-account-details table

Revision ID: 2edc7f8e0f09
Revises: 82086dcc3af1
Create Date: 2020-12-10 12:35:14.902909

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '2edc7f8e0f09'
down_revision = '82086dcc3af1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'deterlab-account-details',
    	sa.Column('uid', sa.String(255), primary_key=True),
    	sa.Column('username',sa.String(255), nullable=False, unique=True),
    	sa.Column('password',sa.String(255),nullable=False,),
    	sa.Column('created_at',sa.DateTime, nullable=False,default=datetime.utcnow),
    	sa.Column('updated_at',sa.DateTime, onupdate=datetime.utcnow),
    	sa.Column('last_login_time',sa.DateTime),
    	sa.Column('isdeleted',sa.Boolean,nullable=False,default=False),

    )


def downgrade():
    op.drop_table('deterlab-account-details')
