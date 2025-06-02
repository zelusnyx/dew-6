"""add deleted_at timestamp to experiment table

Revision ID: b36442b2c355
Revises: f09cc632345b
Create Date: 2020-04-06 20:56:52.683825

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b36442b2c355'
down_revision = 'f09cc632345b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('experiment', 
        sa.Column('deleted_at', sa.DateTime, nullable=True)
    )


def downgrade():
    op.drop_column('experiment', 'deleted_at')
