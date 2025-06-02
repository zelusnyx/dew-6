"""add start/stop to daterlab_run_script_log

Revision ID: 901208673292
Revises: 607ff753485b
Create Date: 2021-03-26 13:46:24.825456

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '901208673292'
down_revision = '607ff753485b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('deterlab_run_script_log',
        sa.Column('action',sa.String(255), default="start")
    )    
    pass


def downgrade():
    pass
