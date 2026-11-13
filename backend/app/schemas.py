from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    display_name: str = Field(min_length=2, max_length=120)
    workspace_name: str | None = Field(default=None, min_length=2, max_length=120)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class MeResponse(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str | None
    workspace_id: UUID
    workspace_name: str
    role: str
