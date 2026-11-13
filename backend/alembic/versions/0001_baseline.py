"""Baseline existing SafeSphere_AI_Database_Schema_v1.sql.

Revision ID: 0001_baseline
Revises:

This empty revision records that the 22 tables were imported using pgAdmin.
It does not create, drop or modify those tables.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
