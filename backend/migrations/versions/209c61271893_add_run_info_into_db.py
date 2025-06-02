"""add run info into DB

Revision ID: 209c61271893
Revises: 42584a5ffa46
Create Date: 2022-02-15 19:54:06.314107

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '209c61271893'
down_revision = '42584a5ffa46'
branch_labels = None
depends_on = None


def upgrade():
    pass
    # op.add_column('deterlab_run_script_log',
    #  sa.Column('action', sa.Text))


def downgrade():
    pass
    # op.drop_column('deterlab_run_script_log', 'action')
