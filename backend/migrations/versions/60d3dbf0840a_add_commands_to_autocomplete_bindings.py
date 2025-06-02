"""add commands to autocomplete bindings

Revision ID: 60d3dbf0840a
Revises: 91100b1fbed3
Create Date: 2020-08-23 17:05:52.263438

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '60d3dbf0840a'
down_revision = '91100b1fbed3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'autocomplete_bindings',
    	sa.Column('id', sa.Integer, primary_key=True),
    	sa.Column('command', sa.String(255), nullable=False),
    	sa.Column('active', sa.Boolean, default=True)
    )


def downgrade():
    op.drop_table('autocomplete_bindings')
