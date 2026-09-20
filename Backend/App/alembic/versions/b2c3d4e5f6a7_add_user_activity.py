"""add user activity and token session history"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_activity",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("emp_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=64), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["emp_id"], ["users.emp_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_activity_emp_id", "user_activity", ["emp_id"])
    op.create_index("ix_user_activity_event_type", "user_activity", ["event_type"])
    op.create_index("ix_user_activity_occurred_at", "user_activity", ["occurred_at"])
    op.create_index("ix_user_activity_token_hash", "user_activity", ["token_hash"])
    op.execute(
        "INSERT INTO user_activity (emp_id, event_type) "
        "SELECT emp_id, 'member_since' FROM users"
    )
    op.drop_column("users", "password_reset_token_hash")


def downgrade() -> None:
    op.add_column(
        "users", sa.Column("password_reset_token_hash", sa.String(), nullable=True)
    )
    op.drop_index("ix_user_activity_token_hash", table_name="user_activity")
    op.drop_index("ix_user_activity_occurred_at", table_name="user_activity")
    op.drop_index("ix_user_activity_event_type", table_name="user_activity")
    op.drop_index("ix_user_activity_emp_id", table_name="user_activity")
    op.drop_table("user_activity")
