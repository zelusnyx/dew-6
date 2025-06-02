"""add default_experiment_id to user

Revision ID: 91100b1fbed3
Revises: 8a65392f693d
Create Date: 2020-06-07 11:14:16.257509

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '91100b1fbed3'
down_revision = '8a65392f693d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user',
    	sa.Column('default_experiment_id',sa.Integer)
    )


def downgrade():
    op.drop_column('user', 'default_experiment_id')
