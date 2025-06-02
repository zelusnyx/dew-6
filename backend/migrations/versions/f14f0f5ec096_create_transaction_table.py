"""Create transaction table

Revision ID: f14f0f5ec096
Revises: 601f6b4bf48f
Create Date: 2020-05-06 12:12:54.281554

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f14f0f5ec096'
down_revision = '601f6b4bf48f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'transaction',
        sa.Column('issued_at',sa.String(255)),
        sa.Column('remote_addr', sa.String(255)),
    )


def downgrade():
    op.drop_table('transaction')
