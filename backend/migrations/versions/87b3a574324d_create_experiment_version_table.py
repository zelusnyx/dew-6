"""create experiment_version table

Revision ID: 87b3a574324d
Revises: f14f0f5ec096
Create Date: 2020-05-06 12:25:00.807784

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '87b3a574324d'
down_revision = 'f14f0f5ec096'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'experiment_version',
        sa.Column('experiment_id', sa.Integer),
        sa.Column('name', sa.String(255), default='untitled'),
        sa.Column('description', sa.Text),
        sa.Column('nlp_content', sa.Text),
        sa.Column('content', sa.Text),
        sa.Column('created_at', sa.DateTime,default=datetime.utcnow),
        sa.Column('deleted_at', sa.DateTime,default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime,onupdate=datetime.utcnow),
        sa.Column('uid',sa.String(255), sa.ForeignKey('user.uid')),
        sa.Column('transaction_id', sa.Integer, primary_key=True),
        sa.Column('end_transaction_id', sa.Integer),
        sa.Column('operation_type', sa.Integer)
    )


def downgrade():
    op.drop_table('experiment_version')
