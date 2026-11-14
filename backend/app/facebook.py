"""Phase 2 Facebook Page connection routes. No comments or AI are fetched here.

Route prefix is /facebook, exposed to browsers as /api/facebook via Next.js.
All stored tokens are encrypted; nothing token-bearing is returned to clients.
"""
from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import urlsplit
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from .auth import current_user, current_user_response
from .config import Settings, get_settings
from .db import get_db
from .facebook_service import (
    MetaAPIError,
    authorization_url,
    digest_state,
    discover_pages,
    encrypt_page_token,
    exchange_code,
    facebook_ready,
    granted_permissions,
    maybe_exchange_long_lived,
    new_state,
    require_facebook_setup,
)
from .models import AuditLog, OAuthState, SocialConnection, Workspace

router = APIRouter(prefix="/facebook", tags=["facebook"])
SessionDep = Annotated[Session, Depends(get_db)]


class PageSelectionInput(BaseModel):
    connection_id: UUID


def _workspace_context(request: Request, db: Session, *, manage: bool = False) -> tuple[UUID, UUID]:
    user = current_user(db, request)
    me = current_user_response(db, user)
    if manage and me.role not in {"owner", "admin"}:
        raise HTTPException(403, "You need owner or admin access to manage Page connections")
    return user.id, me.workspace_id


def _require_origin(request: Request, settings: Settings) -> None:
    """Require browser mutation requests to originate at the configured frontend."""
    origin = request.headers.get("origin")
    if not origin:
        ref = request.headers.get("referer", "")
        try:
            p = urlsplit(ref)
            origin = f"{p.scheme}://{p.netloc}" if p.scheme and p.netloc else ""
        except ValueError:
            origin = ""
    if origin.rstrip("/") != settings.app_origin.rstrip("/"):
        raise HTTPException(403, "Invalid request origin")


def _go_dashboard(settings: Settings, status: str) -> RedirectResponse:
    # Only a fixed enum value ever reaches the Location header.
    assert status in {"connected", "cancelled", "no_pages", "error", "invalid_state", "session_expired"}
    return RedirectResponse(f"{settings.app_origin.rstrip('/')}/dashboard?facebook={status}", status_code=303)


def _audit(db: Session, workspace_id: UUID, user_id: UUID, event: str, connection_id: UUID | None = None) -> None:
    db.add(AuditLog(
        workspace_id=workspace_id,
        actor_user_id=user_id,
        event_type=event,
        object_type="social_connection" if connection_id else None,
        object_id=connection_id,
        metadata_json={},
    ))


def _connection_json(connection: SocialConnection) -> dict:
    caps = connection.capabilities or {}
    tasks = caps.get("tasks", [])
    return {
        "id": str(connection.id),
        "page_id": connection.provider_account_id,
        "name": connection.display_name,
        "status": connection.status,
        "is_demo": connection.is_demo,
        "selected": bool(caps.get("selected", False)),
        "tasks": [t for t in tasks if isinstance(t, str)] if isinstance(tasks, list) else [],
        "granted_scopes": connection.granted_scopes or [],
        "has_token": bool(connection.encrypted_token) and not connection.is_demo,
    }


@router.get("/connect")
def facebook_connect(request: Request, db: SessionDep):
    settings = get_settings()
    user_id, workspace_id = _workspace_context(request, db, manage=True)
    require_facebook_setup(settings)

    raw_state = new_state()
    db.add(OAuthState(
        user_id=user_id,
        workspace_id=workspace_id,
        provider="facebook",
        state_hash=digest_state(raw_state),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        redirect_after="/dashboard",
    ))
    db.commit()
    # Top-level redirect keeps the SameSite=Lax SafeSphere login cookie on Meta's callback.
    return RedirectResponse(authorization_url(settings, raw_state), status_code=303)


@router.get("/callback")
def facebook_callback(
    request: Request,
    db: SessionDep,
    state: str | None = Query(default=None),
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
):
    settings = get_settings()
    try:
        user_id, workspace_id = _workspace_context(request, db, manage=True)
    except HTTPException:
        return _go_dashboard(settings, "session_expired")
    if not state or len(state) > 512:
        return _go_dashboard(settings, "invalid_state")

    # Atomic one-time claim, tied to the SAME SafeSphere user and workspace.
    # Invalid, expired, mismatched, or replayed callbacks are rejected.
    claimed = db.execute(
        update(OAuthState)
        .where(
            OAuthState.state_hash == digest_state(state),
            OAuthState.provider == "facebook",
            OAuthState.user_id == user_id,
            OAuthState.workspace_id == workspace_id,
            OAuthState.consumed_at.is_(None),
            OAuthState.expires_at > func.now(),
        )
        .values(consumed_at=func.now())
        .returning(OAuthState.id)
    ).scalar_one_or_none()
    db.commit()
    if claimed is None:
        return _go_dashboard(settings, "invalid_state")
    if error or not code:
        return _go_dashboard(settings, "cancelled")
    try:
        require_facebook_setup(settings)
        with httpx.Client(timeout=15.0, follow_redirects=False) as client:
            user_token = exchange_code(client, settings, code)
            user_token = maybe_exchange_long_lived(client, settings, user_token)
            pages = discover_pages(client, settings, user_token)
            scopes = granted_permissions(client, settings, user_token)
        if not pages:
            return _go_dashboard(settings, "no_pages")

        # Lock workspace while replacing the selection, so concurrent callbacks
        # and manual selection cannot produce two selected connections.
        db.execute(select(Workspace).where(Workspace.id == workspace_id).with_for_update()).scalar_one()
        existing_rows = db.scalars(
            select(SocialConnection).where(
                SocialConnection.workspace_id == workspace_id,
                SocialConnection.provider == "facebook",
            )
        ).all()
        existing = {r.provider_account_id: r for r in existing_rows}
        approved_ids = {p.page_id for p in pages}
        previously_selected = next((r.provider_account_id for r in existing_rows
                                    if r.capabilities and r.capabilities.get("selected")
                                    and not r.is_demo and r.status == "connected"), None)
        chosen_id = previously_selected if previously_selected in approved_ids else (
            pages[0].page_id if len(pages) == 1 else None
        )

        # Any previously connected Page not covered by new authorization is no
        # longer usable through our app; erase its local credential.
        for row in existing_rows:
            if row.provider_account_id not in approved_ids and not row.is_demo and row.status == "connected":
                row.status = "reauth_required"
                row.encrypted_token = None
                row.capabilities = {**(row.capabilities or {}), "selected": False}
                row.updated_at = datetime.now(timezone.utc)
            elif row.capabilities and row.capabilities.get("selected"):
                row.capabilities = {**row.capabilities, "selected": False}

        for page in pages:
            row = existing.get(page.page_id)
            if row is None:
                row = SocialConnection(
                    workspace_id=workspace_id,
                    provider="facebook",
                    provider_account_id=page.page_id,
                    display_name=page.name,
                )
                db.add(row)
            row.display_name = page.name
            row.is_demo = False
            row.status = "connected"
            row.encrypted_token = encrypt_page_token(page.access_token, settings)
            row.granted_scopes = scopes  # Granted by Meta, not simply requested.
            row.capabilities = {
                "selected": page.page_id == chosen_id,
                "tasks": page.tasks,
                "read_only": True,
            }
            row.token_expires_at = None  # Page-token expiry not verified; never invent one.
            row.updated_at = datetime.now(timezone.utc)
        _audit(db, workspace_id, user_id, "facebook.connected")
        db.commit()
        return _go_dashboard(settings, "connected")
    except (MetaAPIError, httpx.RequestError, ValueError):
        db.rollback()
        return _go_dashboard(settings, "error")
    except Exception:
        db.rollback()
        raise  # Avoid concealing programming/database failures in development.


@router.get("/connection")
def facebook_connection(request: Request, db: SessionDep):
    _, workspace_id = _workspace_context(request, db)
    records = db.scalars(
        select(SocialConnection)
        .where(SocialConnection.workspace_id == workspace_id,
               SocialConnection.provider == "facebook",
               SocialConnection.status != "disconnected")
        .order_by(SocialConnection.created_at)
    ).all()
    settings = get_settings()
    return {
        "pages": [_connection_json(row) for row in records],
        "facebook_ready": facebook_ready(settings),
        "demo_available": settings.facebook_mock,
    }


@router.post("/select-page")
def select_facebook_page(payload: PageSelectionInput, request: Request, db: SessionDep):
    settings = get_settings()
    _require_origin(request, settings)
    user_id, workspace_id = _workspace_context(request, db, manage=True)
    db.execute(select(Workspace).where(Workspace.id == workspace_id).with_for_update()).scalar_one()
    rows = db.scalars(select(SocialConnection).where(
        SocialConnection.workspace_id == workspace_id,
        SocialConnection.provider == "facebook",
    )).all()
    chosen = next((r for r in rows if r.id == payload.connection_id), None)
    if chosen is None:
        raise HTTPException(404, "Facebook Page connection not found")
    if chosen.status != "connected" or (not chosen.is_demo and not chosen.encrypted_token):
        raise HTTPException(409, "This Page needs to be reconnected before selection")
    for row in rows:
        caps = dict(row.capabilities or {})
        caps["selected"] = row.id == chosen.id
        row.capabilities = caps
        row.updated_at = datetime.now(timezone.utc)
    _audit(db, workspace_id, user_id, "facebook.page_selected", chosen.id)
    db.commit()
    return {"selected_connection_id": str(chosen.id)}


@router.delete("/connection")
def disconnect_facebook_page(
    request: Request, db: SessionDep,
    connection_id: UUID = Query(...),
):
    _require_origin(request, get_settings())
    user_id, workspace_id = _workspace_context(request, db, manage=True)
    db.execute(select(Workspace).where(Workspace.id == workspace_id).with_for_update()).scalar_one()
    row = db.scalar(select(SocialConnection).where(
        SocialConnection.id == connection_id,
        SocialConnection.workspace_id == workspace_id,
        SocialConnection.provider == "facebook",
    ))
    if row is None:
        raise HTTPException(404, "Facebook Page connection not found")
    row.encrypted_token = None  # Local disconnect; user may separately revoke in Facebook.
    row.status = "disconnected"
    row.granted_scopes = []
    row.capabilities = {**(row.capabilities or {}), "selected": False, "tasks": []}
    row.updated_at = datetime.now(timezone.utc)
    _audit(db, workspace_id, user_id, "facebook.disconnected", row.id)
    db.commit()
    return {"ok": True}


@router.post("/demo-connect", status_code=201)
def connect_facebook_demo(request: Request, db: SessionDep):
    settings = get_settings()
    _require_origin(request, settings)
    user_id, workspace_id = _workspace_context(request, db, manage=True)
    if not settings.facebook_mock:
        raise HTTPException(404, "Demo connection is disabled")
    db.execute(select(Workspace).where(Workspace.id == workspace_id).with_for_update()).scalar_one()
    rows = db.scalars(select(SocialConnection).where(
        SocialConnection.workspace_id == workspace_id,
        SocialConnection.provider == "facebook",
    )).all()
    for row in rows:
        row.capabilities = {**(row.capabilities or {}), "selected": False}
    page_id = "demo:safesphere-page"
    chosen = next((r for r in rows if r.provider_account_id == page_id), None)
    if chosen is None:
        chosen = SocialConnection(
            workspace_id=workspace_id,
            provider="facebook",
            provider_account_id=page_id,
            display_name="SafeSphere AI Demo Hub — Demo Data",
        )
        db.add(chosen)
        db.flush()
    chosen.is_demo = True
    chosen.status = "connected"
    chosen.encrypted_token = None
    chosen.granted_scopes = []
    chosen.capabilities = {"selected": True, "tasks": [], "demo_only": True, "read_only": True}
    chosen.updated_at = datetime.now(timezone.utc)
    _audit(db, workspace_id, user_id, "facebook.demo_connected", chosen.id)
    db.commit()
    return {"ok": True, "connection_id": str(chosen.id), "is_demo": True}
