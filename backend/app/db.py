from functools import lru_cache
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from .config import get_settings


@lru_cache

def get_engine():
    # We are using the PostgreSQL tables already created in pgAdmin.
    # DO NOT call Base.metadata.create_all(). Future changes use Alembic.
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def get_db() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session
