from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    app_origin: str = "http://localhost:3000"
    cookie_secure: bool = False
    session_hours: int = 8
    cookie_name: str = "safesphere_session"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache

def get_settings() -> Settings:
    settings = Settings()
    if len(settings.jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 characters")
    if settings.session_hours < 1 or settings.session_hours > 24:
        raise RuntimeError("SESSION_HOURS must be between 1 and 24")
    return settings
