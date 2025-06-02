"""add column logs to deterlab_run_script_log table

Revision ID: b57faeacec71
Revises: 209c61271893
Create Date: 2022-04-01 14:01:38.461485

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b57faeacec71'
down_revision = '209c61271893'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('deterlab_run_script_log', 
        sa.Column('logs', sa.String(5000), nullable=True)
    )


def downgrade():
    op.drop_column('deterlab_run_script_log', 'logs')
