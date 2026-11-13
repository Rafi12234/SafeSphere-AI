from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models import User, Workspace, WorkspaceMembership
from .schemas import LoginInput, MeResponse, RegisterInput
from .security import create_session_token, hash_password, user_id_from_request, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
SessionDep = Annotated[Session, Depends(get_db)]


def set_cookie(response: Response, user_id: UUID) -> None:
    s = get_settings()
    response.set_cookie(
        key=s.cookie_name,
        value=create_session_token(user_id),
        httponly=True,
        secure=s.cookie_secure,
        samesite="lax",
        max_age=s.session_hours * 3600,
        path="/",
    )


def current_user(db: Session, request: Request) -> User:
    user = db.get(User, user_id_from_request(request))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User unavailable")
    return user


def current_user_response(db: Session, user: User) -> MeResponse:
    row = db.execute(
        select(WorkspaceMembership, Workspace)
        .join(Workspace, WorkspaceMembership.workspace_id == Workspace.id)
        .where(
            WorkspaceMembership.user_id == user.id,
            WorkspaceMembership.status == "active",
            Workspace.status == "active",
        )
        .order_by(Workspace.created_at)
        .limit(1)
    ).first()
    if row is None:
        raise HTTPException(status_code=403, detail="No active workspace")
    membership, workspace = row
    return MeResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        workspace_id=workspace.id,
        workspace_name=workspace.name,
        role=membership.role,
    )


@router.post("/register", response_model=MeResponse, status_code=201)
def register(payload: RegisterInput, response: Response, db: SessionDep):
    email = payload.email.lower()
    if db.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=email, password_hash=hash_password(payload.password), display_name=payload.display_name.strip())
    db.add(user)
    try:
        db.flush()  # user UUID created by the DB
        workspace = Workspace(owner_user_id=user.id, name=(payload.workspace_name or f"{payload.display_name.strip()}'s Workspace"))
        db.add(workspace)
        db.flush()
        db.add(WorkspaceMembership(workspace_id=workspace.id, user_id=user.id, role="owner", status="active"))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Account creation conflict") from None
    set_cookie(response, user.id)
    return current_user_response(db, user)


@router.post("/login", response_model=MeResponse)
def login(payload: LoginInput, response: Response, db: SessionDep):
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    me = current_user_response(db, user)
    set_cookie(response, user.id)
    return me


@router.post("/logout")
def logout(response: Response):
    s = get_settings()
    response.delete_cookie(s.cookie_name, path="/", samesite="lax", secure=s.cookie_secure, httponly=True)
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
def me(request: Request, db: SessionDep):
    return current_user_response(db, current_user(db, request))
