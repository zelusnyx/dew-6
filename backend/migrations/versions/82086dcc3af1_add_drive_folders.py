"""add drive folders

Revision ID: 82086dcc3af1
Revises: 60d3dbf0840a
Create Date: 2020-08-27 11:55:24.815639

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '82086dcc3af1'
down_revision = '60d3dbf0840a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user',
                  sa.Column('drive_folder_id', sa.String(255), nullable=True)
    )
    op.add_column('drive_table',
        sa.Column('file_type',sa.String(255),nullable=False,default="dew",server_default="dew")
    )


def downgrade():
    op.drop_column('user','drive_folder_id')
    op.drop_column('drive_table','file_type')