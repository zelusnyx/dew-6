"""create_slides_table

Revision ID: bb7caa13752a
Revises: 607ff753485b
Create Date: 2021-01-04 13:11:13.001149

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'bb7caa13752a'
down_revision = '607ff753485b'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'experiment_slides',
    	sa.Column('slide_id', sa.Integer, primary_key=True),
    	sa.Column('experiment_id', sa.Integer,sa.ForeignKey('experiment.experiment_id')),
    	sa.Column('sequence_number', sa.Integer,default=1,nullable=False),
    	sa.Column('actor_action_mapping', sa.Text),
    	sa.Column('created_at', sa.DateTime,default=datetime.utcnow),
    	sa.Column('updated_at', sa.DateTime,onupdate=datetime.utcnow)

    )


def downgrade():
    op.drop_table('experiment_slides')
