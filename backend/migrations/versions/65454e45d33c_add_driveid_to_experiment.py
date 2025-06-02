"""Add driveId to experiment

Revision ID: 65454e45d33c
Revises: 87b3a574324d
Create Date: 2020-05-25 15:55:19.585380

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '65454e45d33c'
down_revision = '87b3a574324d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('experiment',
        sa.Column('driveId', sa.String(255), nullable=True)
    )
    op.add_column('experiment_version',
        sa.Column('driveId', sa.String(255), nullable=True)
    )


def downgrade():
    op.drop_column('experiment', 'driveId')
    op.drop_column('experiment_version', 'driveId')
