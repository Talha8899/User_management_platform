"""Application settings loaded from the local environment file."""

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated configuration shared by database and authentication code."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    secret_key: SecretStr
    secret_key_password_reset: SecretStr
    database_url: str
    algorithm: str = "HS256"
    access_token_expire_time: int = 30
    refresh_token_expire_days: int = 1
    activity_retention_days: int = 15
    password_reset_expire_minutes: int = 15
    frontend_base_url: str
    cors_origins: str = "http://localhost:3000"
    refresh_cookie_name: str = "refresh_token"
    refresh_cookie_secure: bool = False
    refresh_cookie_samesite: str = "lax"
    resend_api_key: str
    resend_from_email: str = "onboarding@resend.dev"


settings = Settings()
