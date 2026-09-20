from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth_dependencies import (
    access_token,
    create_refresh_token,
    hash_password,
    hash_reset_token,
    hash_refresh_token,
    password_reset_token,
    prune_old_activity,
    verify_password,
    verify_password_reset_token,
    set_refresh_cookie,
)
from database_dependencies import get_db
from database_model import User_data
from pydentic_config import settings
from Schemas import (
    PasswordResetConfirm,
    PasswordResetRequest,
    User_Add,
)
from services import password_reset_email

import database_model as database_model

# Authentication routes for account creation and OAuth2 password login.
router = APIRouter(tags=["authentication"])


@router.post("/users/password-reset/request")
def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    """Email a short-lived reset link when the address belongs to a user."""
    prune_old_activity(db)
    user = db.query(User_data).filter(User_data.email == request.email).first()

    # Do not reveal whether an email exists in the database.
    if not user:
        return {"message": "If the email is registered, a reset link was sent."}

    token = password_reset_token(user.emp_id)
    db.add(
        database_model.UserActivity(
            emp_id=user.emp_id,
            event_type="password_reset",
            token_hash=hash_reset_token(token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.password_reset_expire_minutes),
        )
    )
    db.commit()
    reset_link = (
        f"{settings.frontend_base_url.rstrip('/')}/passwordReset/set-password"
        f"?token={token}"
    )
    try:
        password_reset_email(user.email, reset_link)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return {"message": "If the email is registered, a reset link was sent."}


@router.post("/users/password-reset/confirm")
def confirm_password_reset(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    """Hash and save a new password from a valid reset link."""
    prune_old_activity(db)
    try:
        user_id = verify_password_reset_token(request.token)
    except Exception as error:
        raise HTTPException(
            status_code=400, detail="Invalid or expired reset link"
        ) from error

    password_hash = hash_password(request.password)
    reset_event = (
        db.query(database_model.UserActivity)
        .filter(
            database_model.UserActivity.emp_id == user_id,
            database_model.UserActivity.event_type == "password_reset",
            database_model.UserActivity.token_hash == hash_reset_token(request.token),
            database_model.UserActivity.revoked_at.is_(None),
            database_model.UserActivity.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    user = db.query(User_data).filter(User_data.emp_id == user_id).first()
    if not reset_event or not user:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Invalid or already used reset link"
        )
    user.password_hash = password_hash
    reset_event.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password updated successfully. You can now sign in."}


# Register a new user after validating the request schema.
@router.post("/users/signup", status_code=status.HTTP_201_CREATED)
def add_user(user: User_Add, db: Session = Depends(get_db)):
    prune_old_activity(db)
    db_user = (
        db.query(database_model.User_data)
        .filter(database_model.User_data.email == user.email)
        .first()
    )
    if db_user:
        raise HTTPException(status_code=409, detail="user already exists")

    # Never store the plain-text password in the database.
    hashed_password = hash_password(user.password)
    new_user = database_model.User_data(
        **user.model_dump(exclude={"password"}),
        password_hash=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.add(
        database_model.UserActivity(emp_id=new_user.emp_id, event_type="member_since")
    )
    db.commit()
    return {"message": "user signed up successfully"}


# Authenticate an existing user and issue a role-bearing JWT.
@router.post("/users/login")
def login(
    response: Response,
    login: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    prune_old_activity(db)
    email = login.username.strip().lower()
    user = db.query(User_data).filter(User_data.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="invalid credentials")

    password_is_valid = verify_password(login.password, user.password_hash)
    if not password_is_valid:
        raise HTTPException(status_code=401, detail="invalid credentials")

    # Login activity starts the presence window used by the admin dashboard.
    now = datetime.now(timezone.utc)
    user.last_seen_at = now
    refresh_token = create_refresh_token()
    db.add(
        database_model.UserActivity(
            emp_id=user.emp_id, event_type="login", occurred_at=now
        )
    )
    db.add(
        database_model.UserActivity(
            emp_id=user.emp_id,
            event_type="refresh_token",
            token_hash=hash_refresh_token(refresh_token),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
            occurred_at=now,
        )
    )
    db.commit()

    token = access_token({"sub": str(user.emp_id), "role": user.role})

    set_refresh_cookie(response, refresh_token)
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/users/refresh")
def refresh_access_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Rotate a refresh token and issue a short-lived access token."""
    now = datetime.now(timezone.utc)
    prune_old_activity(db, now)
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token is required")
    token_hash = hash_refresh_token(refresh_token)
    session = (
        db.query(database_model.UserActivity)
        .filter(
            database_model.UserActivity.event_type == "refresh_token",
            database_model.UserActivity.token_hash == token_hash,
            database_model.UserActivity.revoked_at.is_(None),
            database_model.UserActivity.expires_at > now,
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(User_data).filter(User_data.emp_id == session.emp_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    session.revoked_at = now
    session.last_used_at = now
    new_refresh_token = create_refresh_token()
    db.add(
        database_model.UserActivity(
            emp_id=user.emp_id,
            event_type="refresh_token",
            token_hash=hash_refresh_token(new_refresh_token),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
            occurred_at=now,
        )
    )
    db.commit()
    set_refresh_cookie(response, new_refresh_token)
    return {
        "access_token": access_token({"sub": str(user.emp_id), "role": user.role}),
        "token_type": "bearer",
    }
