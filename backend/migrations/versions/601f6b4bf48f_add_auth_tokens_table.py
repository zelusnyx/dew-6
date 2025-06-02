"""add auth_tokens table

Revision ID: 601f6b4bf48f
Revises: b36442b2c355
Create Date: 2020-04-09 12:51:35.625396

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '601f6b4bf48f'
down_revision = 'b36442b2c355'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'auth_tokens',
        sa.Column('experiment_id', sa.Integer,nullable=False),
        sa.Column('token',sa.String(255),primary_key=True),
        sa.Column('access_level',sa.String(255),nullable=False),
        sa.Column('created_at',sa.DateTime, nullable=False,default=datetime.utcnow),
    	sa.Column('updated_at',sa.DateTime, onupdate=datetime.utcnow),
        sa.Column('creator_uid', sa.String(255), primary_key=True),
        sa.Column('active',sa.Boolean,default=True)
    )


def downgrade():
    op.drop_table('auth_tokens')
