"""create driveTable

Revision ID: 8a65392f693d
Revises: 65454e45d33c
Create Date: 2020-05-27 17:56:35.705101

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8a65392f693d'
down_revision = '65454e45d33c'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'drive_table',
        sa.Column('uid', sa.String(255), sa.ForeignKey('user.uid'),primary_key=True),
        sa.Column('experiment_id', sa.Integer, sa.ForeignKey('experiment.experiment_id'), primary_key=True),
        sa.Column('driveFileId', sa.String(255), primary_key=True)
    )


def downgrade():
    op.drop_table('drive_table')
