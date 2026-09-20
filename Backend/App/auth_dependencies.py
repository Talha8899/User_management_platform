import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Response, Cookie
import jwt
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from pydentic_config import settings
from sqlalchemy.orm import Session

import database_model as database_model
from database_dependencies import get_db

# PasswordHash selects the recommended Argon2 configuration for this project.
password_hasher = PasswordHash.recommended()

# FastAPI uses this scheme to read bearer tokens from protected requests.
Oauth_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def hash_password(password: str) -> str:
    """Hash a plain password before it is stored in the database."""
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its stored Argon2 hash."""
    return password_hasher.verify(plain_password, hashed_password)


def hash_reset_token(token: str) -> str:
    """Hash a reset token before storing it in the database."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_refresh_token() -> str:
    """Create an opaque token; only its hash is stored in the database."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """Hash an opaque refresh token before comparing or storing it."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def prune_old_activity(db: Session, now: datetime | None = None) -> None:
    """Delete activity rows older than the configured retention window."""
    current_time = now or datetime.now(timezone.utc)
    cutoff = current_time - timedelta(days=settings.activity_retention_days)
    db.query(database_model.UserActivity).filter(
        database_model.UserActivity.occurred_at < cutoff,
        database_model.UserActivity.event_type != "member_since",
    ).delete(synchronize_session=False)


def password_reset_token(user_id: int) -> str:
    """Create a short-lived, purpose-specific password reset token."""
    expiry_time = datetime.now(timezone.utc) + timedelta(
        minutes=settings.password_reset_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "purpose": "password_reset",
        "exp": expiry_time,
    }
    return jwt.encode(
        payload,
        settings.secret_key_password_reset.get_secret_value(),
        algorithm=settings.algorithm,
    )


def verify_password_reset_token(token: str) -> int:
    """Validate a reset token and return its user ID."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key_password_reset.get_secret_value(),
            algorithms=[settings.algorithm],
        )
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as error:
        raise ValueError("Invalid or expired reset link") from error

    if payload.get("purpose") != "password_reset":
        raise ValueError("Invalid reset token purpose")

    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("Invalid reset token subject") from error


def access_token(data: dict) -> str:
    """Create a signed JWT containing the supplied claims and expiry time."""
    to_encode = data.copy()
    expiry_time = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_time
    )
    to_encode.update({"exp": expiry_time})
    return jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )


def verify_access_token(token: str):
    """Decode and validate a JWT, returning its claims."""
    try:
        data = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
        )
        return data

    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as error:
        raise HTTPException(
            status_code=401, detail="Invalid or expired token"
        ) from error


def get_logged_in_user(
    token: str = Depends(Oauth_scheme), db: Session = Depends(get_db)
):
    """Resolve the authenticated database user from the bearer token."""
    payload = verify_access_token(token)
    emp_id = payload.get("sub")
    if emp_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        emp_id = int(emp_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = (
        db.query(database_model.User_data)
        .filter(database_model.User_data.emp_id == emp_id)
        .first()
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def require_admin(
    current_user: database_model.User_data = Depends(get_logged_in_user),
):
    """Allow the request only when the authenticated user is an administrator."""
    if not current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )
