"""add_binding_mapping_to_slides

Revision ID: 2fcce813374e
Revises: bb7caa13752a
Create Date: 2021-03-04 11:45:05.391275

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2fcce813374e'
down_revision = 'bb7caa13752a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('experiment_slides',
    	sa.Column('action_binding_mapping', sa.Text)
    )


def downgrade():
    op.drop_column('experiment_slides', 'action_binding_mapping')
