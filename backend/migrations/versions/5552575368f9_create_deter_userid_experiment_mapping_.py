"""create deterlab_userid_experiment_mapping table

Revision ID: 5552575368f9
Revises: 2edc7f8e0f09
Create Date: 2020-12-19 17:27:27.619482

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '5552575368f9'
down_revision = '2edc7f8e0f09'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
    	'deterlab_userid_experiment_mapping',
    	sa.Column('mid', sa.Integer, primary_key=True),
    	sa.Column('daid', sa.Integer, nullable=False),
    	sa.Column('experiment_id', sa.Integer, sa.ForeignKey('experiment.experiment_id')),
    	sa.Column('project_name',sa.String(255), nullable=False),
    	sa.Column('experiment_name',sa.String(255),nullable=False),
    	sa.Column('created_at',sa.DateTime, nullable=False,default=datetime.utcnow),
    	sa.Column('updated_at',sa.DateTime, nullable=False,onupdate=datetime.utcnow),
    	sa.Column('isdeleted',sa.Boolean,nullable=False,default=False),

    )


def downgrade():
    op.drop_table('deterlab_userid_experiment_mapping')
