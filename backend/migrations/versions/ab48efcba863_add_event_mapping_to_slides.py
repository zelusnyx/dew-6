"""add_event_mapping_to_slides

Revision ID: ab48efcba863
Revises: 2fcce813374e
Create Date: 2021-04-11 11:57:13.567416

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ab48efcba863'
down_revision = '2fcce813374e'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('experiment_slides',
    	sa.Column('action_events_mapping', sa.Text)
    )


def downgrade():
    op.drop_column('experiment_slides', 'action_binding_mapping')
