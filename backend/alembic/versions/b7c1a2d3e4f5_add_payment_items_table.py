"""add payment_items table

Revision ID: b7c1a2d3e4f5
Revises: 2e830ed93ff7
Create Date: 2026-01-18 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b7c1a2d3e4f5"
down_revision: Union[str, None] = "2e830ed93ff7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    enums = inspector.get_enums()

    enum_exists = any(e["name"] == "paymenttype" for e in enums)
    if not enum_exists:
        paymenttype = postgresql.ENUM(
            "SCHOOL_FEES",
            "POCKET_MONEY",
            "CLUB_FEES",
            "EXAM_FEES",
            name="paymenttype",
        )
        paymenttype.create(conn)

    op.create_table(
        "payment_items",
        sa.Column("payment_id", sa.String(), nullable=False),
        sa.Column(
            "item_type",
            postgresql.ENUM(
                "SCHOOL_FEES",
                "POCKET_MONEY",
                "CLUB_FEES",
                "EXAM_FEES",
                name="paymenttype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_payment_items_id"), "payment_items", ["id"], unique=False)
    op.create_index(op.f("ix_payment_items_payment_id"), "payment_items", ["payment_id"], unique=False)
    op.create_index(op.f("ix_payment_items_item_type"), "payment_items", ["item_type"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_payment_items_item_type"), table_name="payment_items")
    op.drop_index(op.f("ix_payment_items_payment_id"), table_name="payment_items")
    op.drop_index(op.f("ix_payment_items_id"), table_name="payment_items")
    op.drop_table("payment_items")

    # Note: we do not drop the paymenttype enum because it may be used elsewhere.
