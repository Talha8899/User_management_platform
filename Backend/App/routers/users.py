from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

import database_model as database_model
from auth_dependencies import get_logged_in_user, hash_password, prune_old_activity
from database_dependencies import get_db
from Schemas import ActivityListResponse, user_response, user_update_info
from pydentic_config import settings

# User-facing user-management routes.
router = APIRouter(tags=["users"])


@router.post("/users/me/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
def heartbeat(
    current_user: database_model.User_data = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    """Refresh the current user's presence timestamp."""
    prune_old_activity(db)
    current_user.last_seen_at = datetime.now(timezone.utc)
    db.commit()


@router.post("/users/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    current_user: database_model.User_data = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    """Clear presence when the user explicitly signs out."""
    prune_old_activity(db)
    current_user.last_seen_at = None
    now = datetime.now(timezone.utc)
    db.query(database_model.UserActivity).filter(
        database_model.UserActivity.emp_id == current_user.emp_id,
        database_model.UserActivity.event_type == "refresh_token",
        database_model.UserActivity.revoked_at.is_(None),
    ).update({"revoked_at": now}, synchronize_session=False)
    db.add(
        database_model.UserActivity(
            emp_id=current_user.emp_id, event_type="logout", occurred_at=now
        )
    )
    db.commit()
    response.delete_cookie(key=settings.refresh_cookie_name, path="/")


# Return the authenticated user's own profile.
@router.get("/users/me", response_model=user_response)
def logged_in_user(
    current_user: database_model.User_data = Depends(get_logged_in_user),
):
    return current_user


@router.get("/users/me/activity", response_model=ActivityListResponse)
def current_user_activity(
    current_user: database_model.User_data = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    prune_old_activity(db)
    events = (
        db.query(database_model.UserActivity)
        .filter(
            database_model.UserActivity.emp_id == current_user.emp_id,
            database_model.UserActivity.event_type.in_(["login", "logout"]),
        )
        .order_by(database_model.UserActivity.occurred_at.desc())
        .limit(50)
        .all()
    )
    member_since = (
        db.query(database_model.UserActivity)
        .filter(
            database_model.UserActivity.emp_id == current_user.emp_id,
            database_model.UserActivity.event_type == "member_since",
        )
        .order_by(database_model.UserActivity.occurred_at.asc())
        .first()
    )
    return {
        "member_since": member_since.occurred_at if member_since else None,
        "events": events,
    }


@router.patch("/users/update/me")
def update_user_info_by_user(
    update_user: user_update_info,
    db: Session = Depends(get_db),
    current_user: database_model.User_data = Depends(get_logged_in_user),
):
    """Update editable profile fields for the user."""
    if current_user:
        db_user = (
            db.query(database_model.User_data)
            .filter(database_model.User_data.emp_id == current_user.emp_id)
            .first()
        )
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        # Only fields included in the partial request are changed.
        if update_user.name is not None:
            db_user.name = update_user.name
        if update_user.email is not None:
            db_user.email = update_user.email
        if update_user.address is not None:
            db_user.address = update_user.address
        if update_user.password is not None:
            db_user.password_hash = hash_password(update_user.password)
        db.commit()
        db.refresh(db_user)
        return {"message": "user info updated successfully"}
    else:
        raise HTTPException(
            status_code=403, detail="You are not authorized to update this user"
        )
