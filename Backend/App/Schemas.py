from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# Request model for creating a new user.
class User_Add(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    address: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=50)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()
        if not value:
            raise ValueError("Email could not be empty")
        return value

    @field_validator("name")
    @classmethod
    def validate_string_name(cls, value):
        value = value.strip().lower()
        if not value:
            raise ValueError("value could not be empty")
        return value

    @field_validator("address")
    @classmethod
    def validate_string_address(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("value could not be empty")

        if not any(char.isalpha() for char in value):
            raise ValueError("Address must contain at least one letter")
        return value


# Request model for replacing a user's credentials.
class PasswordResetRequest(BaseModel):
    """Email address submitted to start a password reset."""

    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """New password and signed token submitted from the reset link."""

    token: str
    password: str = Field(min_length=8, max_length=50)


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_type: str
    occurred_at: datetime


class ActivityListResponse(BaseModel):
    member_since: datetime | None
    events: list[ActivityResponse]


# Public user response used by admin and user lookup endpoints.
class user_response(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    emp_id: int
    name: str
    address: str
    role: str
    email: str
    is_active: bool
    last_seen_at: datetime | None


# Paginated response for a list of users, including metadata.
class paginated_user_response(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    users: list[user_response]
    total: int
    limit: int
    skip: int
    has_more: bool


# Partial profile update model; omitted fields remain unchanged.
class update_user_info_admin(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    address: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[str] = None  # Only admin can change the role

    @field_validator("name")
    @classmethod
    def validate_string_name(cls, value):
        # 1. Allow None for partial updates
        if value is None:
            return value
        # 2. if not None, normalize and validate the name
        value = value.strip()
        if not value:
            raise ValueError("value could not be empty")
        return value

    @field_validator("address")
    @classmethod
    def validate_string_address(cls, value):
        # 1. Allow None for partial updates
        if value is None:
            return value
        # 2. if not None, normalize and validate the address
        value = value.strip()
        if not value:
            raise ValueError("value could not be empty")

        if not any(char.isalpha() for char in value):
            raise ValueError("Address must contain at least one letter")
        return value


class user_update_info(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    address: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=50)
