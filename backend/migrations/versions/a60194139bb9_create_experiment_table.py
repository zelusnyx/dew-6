"""Create experiment table

Revision ID: a60194139bb9
Revises: 
Create Date: 2020-03-09 10:23:44.648541

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'a60194139bb9'
down_revision = 'd2c3d5d4573e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'experiment',
        sa.Column('experiment_id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), default='untitled'),
        sa.Column('description', sa.Text),
        sa.Column('nlp_content', sa.Text),
        sa.Column('content', sa.Text),
        sa.Column('created_at', sa.DateTime,default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime,onupdate=datetime.utcnow),
        sa.Column('uid',sa.String(255), sa.ForeignKey('user.uid'))

    )


def downgrade():
    op.drop_table('experiment')
