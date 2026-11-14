"""Phase 3: list cached Page posts and synchronize published posts via Meta.

No real comments, scans, media analysis, or moderation actions.
All reads and writes are scoped to the signed-in user's active workspace.
"""
from datetime import datetime, timezone
from typing import Annotated, Literal
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .facebook import _audit, _require_origin, _workspace_context
from .facebook_service import MetaAPIError, require_facebook_setup
from .models import SocialConnection, SocialPost, Workspace
from .posts_service import PostBatch, decrypt_page_token, demo_posts, fetch_page_posts


router = APIRouter(prefix="/posts", tags=["posts"])
SessionDep = Annotated[Session, Depends(get_db)]


class SyncInput(BaseModel):
    mode: Literal["latest", "older"] = "latest"


def _selected_connection(db: Session, workspace_id: UUID) -> SocialConnection | None:
    rows = db.scalars(
        select(SocialConnection)
        .where(
            SocialConnection.workspace_id == workspace_id,
            SocialConnection.provider == "facebook",
            SocialConnection.status != "disconnected",
        )
        .order_by(SocialConnection.created_at.desc())
    ).all()
    return next((row for row in rows if (row.capabilities or {}).get("selected") is True), None)


def _page_json(row: SocialConnection) -> dict:
    caps = row.capabilities or {}
    return {
        "id": str(row.id),
        "name": row.display_name,
        "is_demo": row.is_demo,
        "status": row.status,
        "last_synced_at": row.last_synced_at.isoformat() if row.last_synced_at else None,
        "has_older_on_facebook": bool(caps.get("posts_next_cursor")) and not row.is_demo,
        "can_sync": row.status == "connected" and (row.is_demo or bool(row.encrypted_token)),
    }


def _post_json(post: SocialPost) -> dict:
    return {
        "id": str(post.id),
        "provider_post_id": post.provider_post_id,
        "caption": post.caption,
        "post_type": post.post_type,
        "thumbnail_url": post.thumbnail_url,
        "permalink": post.permalink,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "is_demo": post.is_demo,
        # None is intentional. Phase 3 does not read or estimate comments.
        "comment_count": None,
    }


@router.get("")
def list_posts(
    request: Request,
    db: SessionDep,
    limit: int = Query(default=24, ge=1, le=50),
    offset: int = Query(default=0, ge=0, le=10000),
):
    _, workspace_id = _workspace_context(request, db)
    connection = _selected_connection(db, workspace_id)
    if connection is None:
        return {"page": None, "posts": [], "total": 0, "limit": limit, "offset": offset, "has_more": False}
    criteria = (
        SocialPost.workspace_id == workspace_id,
        SocialPost.connection_id == connection.id,
    )
    total = db.scalar(select(func.count()).select_from(SocialPost).where(*criteria)) or 0
    posts = db.scalars(
        select(SocialPost).where(*criteria)
        .order_by(SocialPost.published_at.desc().nullslast(), SocialPost.created_at.desc(), SocialPost.id.desc())
        .offset(offset).limit(limit)
    ).all()
    return {
        "page": _page_json(connection),
        "posts": [_post_json(p) for p in posts],
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(posts) < total,
    }


@router.post("/sync")
def sync_posts(payload: SyncInput, request: Request, db: SessionDep):
    settings = get_settings()
    _require_origin(request, settings)
    user_id, workspace_id = _workspace_context(request, db, manage=True)
    connection = _selected_connection(db, workspace_id)
    if connection is None:
        raise HTTPException(409, "Select a Facebook Page on your dashboard before fetching posts")
    if connection.status != "connected":
        raise HTTPException(409, "This Facebook Page needs reconnection before syncing")
    if connection.is_demo and not settings.facebook_mock:
        raise HTTPException(403, "Demo post synchronization is disabled")
    if not connection.is_demo and not connection.encrypted_token:
        raise HTTPException(409, "The Facebook Page credential is missing. Reconnect your Page")

    previous_cursor = (connection.capabilities or {}).get("posts_next_cursor")
    if payload.mode == "older" and (
        connection.is_demo or not isinstance(previous_cursor, str) or not previous_cursor
    ):
        raise HTTPException(409, "There are no additional Facebook post pages to fetch")

    if connection.is_demo:
        batch = demo_posts()
    else:
        require_facebook_setup(settings)
        try:
            token = decrypt_page_token(connection.encrypted_token, settings)
        except ValueError:
            raise HTTPException(409, "Stored Facebook token cannot be read. Reconnect the Page.") from None
        try:
            with httpx.Client(timeout=15.0, follow_redirects=False) as client:
                batch = fetch_page_posts(
                    client, settings, connection.provider_account_id, token,
                    after=previous_cursor if payload.mode == "older" else None,
                )
        except MetaAPIError as exc:
            if exc.status == 400 and "reconnect" in exc.detail.lower():
                # Clear an expired credential, never expose it in logs/responses.
                connection.status = "reauth_required"
                connection.encrypted_token = None
                _audit(db, workspace_id, user_id, "facebook.posts_reauth_required", connection.id)
                db.commit()
            raise HTTPException(status_code=exc.status, detail=exc.detail) from None

    # Serialize writes per workspace, and re-check authorization after the
    # external request in case the user disconnected/switched Pages meanwhile.
    db.execute(select(Workspace).where(Workspace.id == workspace_id).with_for_update()).scalar_one()
    db.refresh(connection)
    caps = dict(connection.capabilities or {})
    if connection.status != "connected" or caps.get("selected") is not True:
        raise HTTPException(409, "Selected Page changed during synchronization. Refresh and retry.")
    if payload.mode == "older" and caps.get("posts_next_cursor") != previous_cursor:
        raise HTTPException(409, "Post pagination changed. Refresh and retry.")

    now = datetime.now(timezone.utc)
    incoming = {post.provider_post_id: post for post in batch.posts}
    existing = {
        row.provider_post_id: row
        for row in db.scalars(
            select(SocialPost).where(
                SocialPost.workspace_id == workspace_id,
                SocialPost.connection_id == connection.id,
                SocialPost.provider_post_id.in_(list(incoming)),
            )
        ).all()
    } if incoming else {}

    for post in incoming.values():
        row = existing.get(post.provider_post_id)
        if row is None:
            row = SocialPost(
                workspace_id=workspace_id,
                connection_id=connection.id,
                provider_post_id=post.provider_post_id,
            )
            db.add(row)
        row.caption = post.caption
        row.post_type = post.post_type
        row.thumbnail_url = post.thumbnail_url
        row.permalink = post.permalink
        row.published_at = post.published_at
        row.comment_count = None
        row.is_demo = connection.is_demo
        row.last_synced_at = now

    caps["posts_next_cursor"] = batch.next_cursor
    caps["posts_last_sync_mode"] = payload.mode
    connection.capabilities = caps
    connection.last_synced_at = now
    _audit(db, workspace_id, user_id, "facebook.posts_synced", connection.id)
    db.commit()
    return {
        "synced": len(incoming),
        "is_demo": connection.is_demo,
        "has_older_on_facebook": bool(batch.next_cursor),
        "last_synced_at": now.isoformat(),
    }
