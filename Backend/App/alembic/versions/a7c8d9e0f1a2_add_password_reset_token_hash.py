"""store one-time password reset token hashes

Revision ID: a7c8d9e0f1a2
Revises: 0f5dbffce093
Create Date: 2026-09-12

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "0f5dbffce093"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_reset_token_hash", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_reset_token_hash")
