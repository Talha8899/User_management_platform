"""add last seen timestamp for user presence

Revision ID: f1a2b3c4d5e6
Revises: ec5fbd0eca3b
Create Date: 2026-09-10

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "ec5fbd0eca3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        op.f("ix_users_last_seen_at"), "users", ["last_seen_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_last_seen_at"), table_name="users")
    op.drop_column("users", "last_seen_at")
