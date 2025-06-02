"""create run_script column in deterlab_run_script_log

Revision ID: 75233f7cf490
Revises: b57faeacec71
Create Date: 2022-05-13 12:57:06.893752

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '75233f7cf490'
down_revision = 'b57faeacec71'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('deterlab_run_script_log', 
        sa.Column('run_script', sa.String(5000), nullable=True)
    )


def downgrade():
    op.drop_column('deterlab_run_script_log', 'run_script')
