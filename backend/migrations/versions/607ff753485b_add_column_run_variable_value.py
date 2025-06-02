"""add column run_variable_value

Revision ID: 607ff753485b
Revises: f498261119e5
Create Date: 2021-01-16 10:22:49.021222

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '607ff753485b'
down_revision = 'f498261119e5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('deterlab_run_script_log',
        sa.Column('run_variable_value', sa.String(255), nullable=True)
    )



def downgrade():
    op.drop_column('deterlab_run_script_log', 'run_variable_value')
