from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from typing import Annotated
from sqlalchemy.orm import Session

import database_model as database_model
from auth_dependencies import get_logged_in_user, prune_old_activity, require_admin
from database_dependencies import get_db
from Schemas import (
    ActivityListResponse,
    paginated_user_response,
    update_user_info_admin,
    user_response,
)

# User-facing and administrator user-management routes.
router = APIRouter(tags=["Admin"])


@router.get("/users/{user_id}/activity", response_model=ActivityListResponse)
def get_user_activity(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: database_model.User_data = Depends(require_admin),
):
    prune_old_activity(db)
    user = (
        db.query(database_model.User_data)
        .filter(database_model.User_data.emp_id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    events = (
        db.query(database_model.UserActivity)
        .filter(
            database_model.UserActivity.emp_id == user_id,
            database_model.UserActivity.event_type.in_(["login", "logout"]),
        )
        .order_by(database_model.UserActivity.occurred_at.desc())
        .limit(100)
        .all()
    )
    member_since = (
        db.query(database_model.UserActivity)
        .filter(
            database_model.UserActivity.emp_id == user_id,
            database_model.UserActivity.event_type == "member_since",
        )
        .order_by(database_model.UserActivity.occurred_at.asc())
        .first()
    )
    return {
        "member_since": member_since.occurred_at if member_since else None,
        "events": events,
    }


# Return every user for the authenticated admin dashboard.
@router.get("/users", response_model=paginated_user_response)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: database_model.User_data = Depends(require_admin),
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    """Return all users and their calculated presence state."""
    user_count = db.execute(select(func.count(database_model.User_data.emp_id)))
    total_users = user_count.scalar() or 0
    result = (
        db.query(database_model.User_data)
        .order_by(database_model.User_data.emp_id)
        .offset(skip)
        .limit(limit)
    )
    db_users = result.all()
    has_more = skip + len(db_users) < total_users

    return paginated_user_response(
        users=db_users, total=total_users, limit=limit, skip=skip, has_more=has_more
    )


# Return one user record by its employee ID.
@router.get("/users/{user_id}", response_model=user_response)
def get_user_with_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: database_model.User_data = Depends(get_logged_in_user),
):
    """return the search user only to admin"""
    current_role = (current_user.role or "").lower()
    if current_role == "admin":
        user = (
            db.query(database_model.User_data)
            .filter(database_model.User_data.emp_id == user_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    raise HTTPException(status_code=403, detail="Admin privileges required")


@router.patch("/users/{emp_id}")
def update_user_info_by_admin(
    emp_id: int,
    update_user: update_user_info_admin,
    db: Session = Depends(get_db),
    current_user: database_model.User_data = Depends(get_logged_in_user),
):
    """Update user profile fields by an administrator."""
    current_role = (current_user.role or "").lower()
    if current_role == "admin":
        db_user = (
            db.query(database_model.User_data)
            .filter(database_model.User_data.emp_id == emp_id)
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
        if update_user.role is not None:
            db_user.role = update_user.role

        db.commit()
        db.refresh(db_user)
        return {"message": "user updated successfully"}
    raise HTTPException(status_code=403, detail="Admin privileges required")


# Delete a user; this operation is restricted to administrators.
@router.delete("/users/{emp_id}")
def delete_user(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: database_model.User_data = Depends(require_admin),
):
    db_user = (
        db.query(database_model.User_data)
        .filter(database_model.User_data.emp_id == emp_id)
        .first()
    )
    if db_user.emp_id == current_user.emp_id:
        raise HTTPException(status_code=403, detail="Admin cannot delete own account")
    if db_user:
        db.delete(db_user)
        db.commit()
        return {"message": "user deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")
