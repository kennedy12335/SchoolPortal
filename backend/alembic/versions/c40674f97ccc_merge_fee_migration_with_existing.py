"""merge_fee_migration_with_existing

Revision ID: c40674f97ccc
Revises: add_fee_and_student_fee_tables, e3df45849480
Create Date: 2026-01-17 21:09:12.619583

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c40674f97ccc'
down_revision: Union[str, None] = ('add_fee_and_student_fee_tables', 'e3df45849480')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
