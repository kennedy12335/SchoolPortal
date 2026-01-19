"""add fee and student_fee tables

Revision ID: add_fee_and_student_fee_tables
Revises: 
Create Date: 2026-01-17 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_fee_and_student_fee_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'fee',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False, unique=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('extra_fees', sa.Float(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'student_fee',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('fee_id', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('discount_percentage', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('paid', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('payment_reference', sa.String(), nullable=True),
        sa.Column('due_date', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'student_exam_fee',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('exam_fee_id', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('discount_percentage', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('paid', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('payment_reference', sa.String(), nullable=True),
        sa.Column('due_date', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_index('ix_student_fee_student_id', 'student_fee', ['student_id'])
    op.create_index('ix_student_fee_fee_id', 'student_fee', ['fee_id'])
    op.create_index('ix_student_exam_fee_student_id', 'student_exam_fee', ['student_id'])
    op.create_index('ix_student_exam_fee_exam_fee_id', 'student_exam_fee', ['exam_fee_id'])


def downgrade():
    op.drop_index('ix_student_exam_fee_exam_fee_id', table_name='student_exam_fee')
    op.drop_index('ix_student_exam_fee_student_id', table_name='student_exam_fee')
    op.drop_index('ix_student_fee_fee_id', table_name='student_fee')
    op.drop_index('ix_student_fee_student_id', table_name='student_fee')
    op.drop_table('student_exam_fee')
    op.drop_table('student_fee')
    op.drop_table('fee')
