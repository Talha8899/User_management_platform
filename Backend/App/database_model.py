"""SQLAlchemy models for the application database."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, declarative_base, mapped_column

# Base class used by SQLAlchemy to discover application tables.
Base = declarative_base()


class User_data(Base):
    """Database representation of an authenticated application user."""

    __tablename__ = "users"

    emp_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        nullable=False,
        autoincrement=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String,
        index=True,
        nullable=False,
    )
    address: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(
        String,
        nullable=False,
        server_default="user",
        default="user",
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    @property
    def is_active(self) -> bool:
        """Return whether the user's last heartbeat is within two minutes."""
        if self.last_seen_at is None:
            return False

        last_seen = self.last_seen_at
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        return last_seen > datetime.now(timezone.utc) - timedelta(minutes=2)


class UserActivity(Base):
    """Audit events and hashed, revocable token sessions for one user."""

    __tablename__ = "user_activity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emp_id: Mapped[int] = mapped_column(
        ForeignKey("users.emp_id", ondelete="CASCADE"), index=True, nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    token_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
