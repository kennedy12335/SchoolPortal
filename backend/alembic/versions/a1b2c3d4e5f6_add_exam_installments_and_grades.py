"""add_exam_installments_and_applicable_grades

Revision ID: a1b2c3d4e5f6
Revises: db55ac5d8324
Create Date: 2026-01-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'db55ac5d8324'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('exam_fees', sa.Column('allows_installments', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('exam_fees', sa.Column('applicable_grades', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('exam_fees', 'applicable_grades')
    op.drop_column('exam_fees', 'allows_installments')
