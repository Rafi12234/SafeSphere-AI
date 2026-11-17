from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    app_origin: str = "http://localhost:3000"
    cookie_secure: bool = False
    session_hours: int = 8
    cookie_name: str = "safesphere_session"

    # Facebook Login for Business — server-side only.
    facebook_app_id: str = ""
    facebook_app_secret: str = ""
    facebook_config_id: str = ""
    facebook_redirect_uri: str = "http://localhost:3000/api/facebook/callback"
    facebook_graph_version: str = "v27.0"
    facebook_token_encryption_key: str = ""
    facebook_mock: bool = False  # Enables a separately labeled fixture-only connection.

    model_config = SettingsConfigDict(env_file=(".env", _ENV_FILE), extra="ignore")


@lru_cache

def get_settings() -> Settings:
    settings = Settings()
    if len(settings.jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 characters")
    if not (1 <= settings.session_hours <= 24):
        raise RuntimeError("SESSION_HOURS must be between 1 and 24")
    return settings
