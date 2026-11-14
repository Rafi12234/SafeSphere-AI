"""Phase 4 hackathon-only simulated scans of selected real or demo Page posts.

POST /scans creates fictional comments and fixed classifications atomically.
GET /scans/{id} reveals results only after a clock-derived 18-second demo.
NO Facebook comments are fetched, NO AI calls are made, and NO moderation
or legal evidence actions occur. Every comment/finding/incident is DEMO DATA.
"""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .facebook import _require_origin, _workspace_context
from .models import (
    AuditLog, Incident, IncidentFinding, Scan, ScanFinding, ScanPost,
    SocialAuthor, SocialComment, SocialPost, Workspace,
)
from .posts import _selected_connection
from .scan_demo import (
    DEMO_AUTHORS, FIXTURES, HARMFUL_LABELS, MAX_HISTORY, MAX_SCAN_POSTS,
    REPEAT_INCIDENT_MIN_POSTS, SCAN_SECONDS, SEVERITY_ORDER,
    demo_statistics, fixture_comments_per_post, progress,
)


router = APIRouter(prefix="/scans", tags=["simulated-scans"])
SessionDep = Annotated[Session, Depends(get_db)]


class CreateScanInput(BaseModel):
    post_ids: list[UUID] = Field(min_length=1, max_length=MAX_SCAN_POSTS)


def _find_scan(db: Session, workspace_id: UUID, scan_id: UUID) -> Scan:
    scan = db.scalar(
        select(Scan).where(Scan.id == scan_id, Scan.workspace_id == workspace_id,
                           Scan.scan_mode == "simulated")
    )
    if scan is None:
        raise HTTPException(404, "Simulated scan not found in this workspace")
    return scan


def _advance(scan: Scan, now: datetime) -> tuple[int, int, bool]:
    pct, count, finished = progress(
        scan.started_at, scan.demo_duration_seconds,
        scan.estimated_comment_count, now,
    )
    if scan.status == "running" and finished:
        scan.status = "completed"
        scan.processed_comment_count = scan.estimated_comment_count
        scan.completed_at = max(now, scan.started_at)
    elif scan.status == "completed":
        return 100, scan.estimated_comment_count, True
    return pct, count, finished


def _summary(scan: Scan, now: datetime) -> dict:
    pct, count, _ = _advance(scan, now)
    return {
        "id": str(scan.id),
        "status": scan.status,
        "scan_mode": "simulated",
        "is_demo": True,
        "data_source": "scripted_demo_fixtures",
        "real_comments_fetched": False,
        "ai_executed": False,
        "progress_percent": pct,
        "estimated_demo_comments": scan.estimated_comment_count,
        "animated_demo_comments_processed": count,
        "started_at": scan.started_at.isoformat(),
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
        "duration_seconds": scan.demo_duration_seconds,
    }


def _audit_scan(db: Session, workspace_id: UUID, user_id: UUID, scan_id: UUID) -> None:
    db.add(AuditLog(
        workspace_id=workspace_id,
        actor_user_id=user_id,
        event_type="demo.scan_created",
        object_type="scan",
        object_id=scan_id,
        metadata_json={"demo_only": True, "no_real_comment_ingestion": True},
    ))


@router.post("", status_code=201)
def create_simulated_scan(payload: CreateScanInput, request: Request, db: SessionDep):
    settings = get_settings()
    _require_origin(request, settings)
    user_id, workspace_id = _workspace_context(request, db, manage=True)
    if len(set(payload.post_ids)) != len(payload.post_ids):
        raise HTTPException(422, "Choose unique posts. Duplicate post IDs are not allowed.")

    # Serializes scan creation with Page-selection changes and other scans in
    # the same workspace. Users cannot scan another workspace/connection.
    db.execute(
        select(Workspace).where(Workspace.id == workspace_id).with_for_update()
    ).scalar_one()
    connection = _selected_connection(db, workspace_id)
    if connection is None or connection.status != "connected":
        raise HTTPException(409, "Connect and select an active Facebook Page first")
    if connection.is_demo and not settings.facebook_mock:
        raise HTTPException(403, "Demo Page is disabled. Reconnect a real Facebook Page.")

    now = datetime.now(timezone.utc)
    # One in-progress demo per workspace. Expired rows are completed inline,
    # so no task runner, cron or worker is needed.
    active = db.scalars(
        select(Scan).where(Scan.workspace_id == workspace_id,
                           Scan.scan_mode == "simulated", Scan.status == "running")
    ).all()
    for old in active:
        _advance(old, now)
        if old.status == "running":
            raise HTTPException(409, "A simulated scan is already in progress. Open its results first.")

    posts = db.scalars(
        select(SocialPost).where(
            SocialPost.workspace_id == workspace_id,
            SocialPost.connection_id == connection.id,
            SocialPost.id.in_(payload.post_ids),
        )
    ).all()
    if len(posts) != len(payload.post_ids):
        raise HTTPException(422, "One or more selected posts are not cached for this Page")
    # Deterministic ordering of fixture assignment between attempts.
    by_id = {p.id: p for p in posts}
    ordered_posts = [by_id[id_] for id_ in payload.post_ids]

    scan = Scan(
        id=uuid4(), workspace_id=workspace_id, connection_id=connection.id,
        initiated_by=user_id, scan_mode="simulated", status="running",
        demo_duration_seconds=SCAN_SECONDS,
        estimated_comment_count=len(ordered_posts) * fixture_comments_per_post(),
        processed_comment_count=0, started_at=now,
    )
    db.add(scan)
    db.flush()
    db.add_all([
        ScanPost(scan_id=scan.id, post_id=post.id, workspace_id=workspace_id,
                 connection_id=connection.id)
        for post in ordered_posts
    ])
    db.flush()  # Composite scan-post FK must exist before inserting findings.

    # Reuse ONLY fictional authors from this connection. Never inspect or
    # resolve real Facebook author IDs/usernames.
    existing_authors = db.scalars(
        select(SocialAuthor).where(
            SocialAuthor.workspace_id == workspace_id,
            SocialAuthor.connection_id == connection.id,
            SocialAuthor.is_demo.is_(True),
            SocialAuthor.provider_author_id.in_(
                [identity[0] for identity in DEMO_AUTHORS.values()]
            ),
        )
    ).all()
    authors_by_provider = {a.provider_author_id: a for a in existing_authors}
    authors: dict[str, SocialAuthor] = {}
    for key, (provider_id, display_name) in DEMO_AUTHORS.items():
        author = authors_by_provider.get(provider_id)
        if author is None:
            author = SocialAuthor(
                id=uuid4(), workspace_id=workspace_id, connection_id=connection.id,
                provider_author_id=provider_id, display_name=display_name,
                username=None, identity_quality="demo", is_demo=True,
            )
            db.add(author)
        authors[key] = author
    db.flush()

    # Seed fixed comments separately from fixed finding labels so the
    # existing composite FKs are always satisfied by the insert order.
    comments: list[SocialComment] = []
    inputs: list[tuple[SocialComment, str, object]] = []
    for post in ordered_posts:
        for idx, item in enumerate(FIXTURES):
            comment = SocialComment(
                id=uuid4(), workspace_id=workspace_id, connection_id=connection.id,
                post_id=post.id, author_id=authors[item.author_key].id,
                provider_comment_id=f"demo:{scan.id}:{post.id}:{idx}",
                comment_text=item.text, content_type="text",
                language_hint=item.language_code, permalink=None,
                published_at=now - timedelta(minutes=(idx + 1) * 7),
                captured_at=now, source_status="available", is_demo=True,
            )
            comments.append(comment)
            inputs.append((comment, item.author_key, item))
    db.add_all(comments)
    db.flush()

    findings: list[ScanFinding] = []
    # Author/incident summaries based on actual inserted *demo fixtures*
    # (not another manufactured total), grouped by fictional identity.
    by_author: dict[str, list[tuple[ScanFinding, SocialComment]]] = defaultdict(list)
    for comment, author_key, item in inputs:
        finding = ScanFinding(
            id=uuid4(), workspace_id=workspace_id, connection_id=connection.id,
            scan_id=scan.id, post_id=comment.post_id, comment_id=comment.id,
            primary_label=item.label, labels=[item.label],
            severity=item.severity, language_code=item.language_code,
            reason_code="scripted_demo_example", explanation=item.explanation,
            source_type="demo_fixture", model_name=None, model_version=None,
            review_status="unreviewed",
        )
        findings.append(finding)
        if item.label in HARMFUL_LABELS:
            by_author[author_key].append((finding, comment))
    db.add_all(findings)
    db.flush()

    incidents: list[tuple[Incident, list[ScanFinding]]] = []
    for author_key, flagged in by_author.items():
        post_count = len({finding.post_id for finding, _ in flagged})
        seen = [comment.published_at for _, comment in flagged if comment.published_at]
        worst = max((finding.severity for finding, _ in flagged),
                    key=lambda value: SEVERITY_ORDER[value])
        for incident_type, eligible, linked in (
            ("repeat_harassment", post_count >= REPEAT_INCIDENT_MIN_POSTS, flagged),
            ("critical_threat",
             any(f.severity == "critical" for f, _ in flagged),
             [(f, c) for f, c in flagged if f.severity == "critical"]),
        ):
            if not eligible:
                continue
            incident = Incident(
                id=uuid4(), workspace_id=workspace_id, connection_id=connection.id,
                scan_id=scan.id, author_id=authors[author_key].id,
                incident_type=incident_type, status="flagged",
                max_severity="critical" if incident_type == "critical_threat" else worst,
                flagged_comment_count=len(linked),
                affected_post_count=len({f.post_id for f, _ in linked}),
                summary=(
                    "FICTIONAL DEMO: scripted harmful comments across at least three selected posts."
                    if incident_type == "repeat_harassment" else
                    "FICTIONAL DEMO: scripted threat example. No real-world threat was detected."
                ),
                is_demo=True, first_seen_at=min(seen) if seen else None,
                last_seen_at=max(seen) if seen else None,
            )
            incidents.append((incident, [f for f, _ in linked]))
    db.add_all([incident for incident, _ in incidents])
    db.flush()
    db.add_all([
        IncidentFinding(
            incident_id=incident.id, finding_id=finding.id,
            workspace_id=workspace_id, scan_id=scan.id,
            connection_id=connection.id,
        )
        for incident, linked in incidents for finding in linked
    ])
    _audit_scan(db, workspace_id, user_id, scan.id)
    db.commit()
    return _summary(scan, now)


@router.get("")
def recent_simulated_scans(request: Request, db: SessionDep):
    _, workspace_id = _workspace_context(request, db)
    rows = db.scalars(
        select(Scan).where(
            Scan.workspace_id == workspace_id,
            Scan.scan_mode == "simulated",
        ).order_by(Scan.created_at.desc(), Scan.id.desc()).limit(MAX_HISTORY)
    ).all()
    now = datetime.now(timezone.utc)
    items = [_summary(row, now) for row in rows]
    if any(row in db.dirty for row in rows):
        db.commit()
    return {"scans": items, "is_demo": True}


@router.get("/{scan_id}")
def get_simulated_scan(scan_id: UUID, request: Request, db: SessionDep):
    _, workspace_id = _workspace_context(request, db)
    scan = _find_scan(db, workspace_id, scan_id)
    now = datetime.now(timezone.utc)
    response = _summary(scan, now)
    if scan in db.dirty:
        db.commit()

    selected = db.execute(
        select(SocialPost.id, SocialPost.provider_post_id, SocialPost.caption, SocialPost.is_demo)
        .join(
            ScanPost,
            (ScanPost.post_id == SocialPost.id) &
            (ScanPost.workspace_id == SocialPost.workspace_id) &
            (ScanPost.connection_id == SocialPost.connection_id),
        )
        .where(
            ScanPost.scan_id == scan.id,
            ScanPost.workspace_id == workspace_id,
            ScanPost.connection_id == scan.connection_id,
        ).order_by(SocialPost.created_at)
    ).all()
    response["selected_posts"] = [
        {"id": str(post_id), "provider_post_id": provider_id,
         "caption": caption, "post_is_demo": is_demo}
        for post_id, provider_id, caption, is_demo in selected
    ]

    # Pre-seeded demo findings remain invisible until the animation completes.
    if response["status"] != "completed":
        response.update({"statistics": None, "findings": [], "incidents": []})
        return response

    rows = db.execute(
        select(ScanFinding, SocialComment, SocialAuthor, SocialPost)
        .join(SocialComment, ScanFinding.comment_id == SocialComment.id)
        .join(SocialAuthor, SocialComment.author_id == SocialAuthor.id)
        .join(SocialPost, ScanFinding.post_id == SocialPost.id)
        .where(
            ScanFinding.scan_id == scan.id,
            ScanFinding.workspace_id == workspace_id,
            ScanFinding.connection_id == scan.connection_id,
            ScanFinding.source_type == "demo_fixture",
            SocialComment.is_demo.is_(True),
            SocialAuthor.is_demo.is_(True),
        )
        .order_by(SocialPost.published_at.desc().nullslast(),
                  ScanFinding.created_at, ScanFinding.id)
    ).all()

    findings: list[dict] = []
    metrics: list[dict] = []
    for finding, comment, author, post in rows:
        findings.append({
            "id": str(finding.id),
            "post_id": str(post.id),
            "post_caption": post.caption,
            "post_is_demo": post.is_demo,
            "author_id": str(author.id),
            "author_name": author.display_name,
            "comment_text": comment.comment_text,
            "label": finding.primary_label,
            "severity": finding.severity,
            "language_code": finding.language_code,
            "explanation": finding.explanation,
            "source_type": "demo_fixture",
            "is_demo": True,
            "confidence": None,
        })
        metrics.append({
            "author_id": str(author.id),
            "author_name": author.display_name,
            "post_id": str(post.id),
            "label": finding.primary_label,
            "severity": finding.severity,
            "language_code": finding.language_code,
        })

    incidents = db.scalars(
        select(Incident).where(
            Incident.scan_id == scan.id,
            Incident.workspace_id == workspace_id,
            Incident.connection_id == scan.connection_id,
            Incident.is_demo.is_(True),
        ).order_by(Incident.incident_type, Incident.created_at)
    ).all()
    response["statistics"] = demo_statistics(metrics)
    response["findings"] = findings
    response["incidents"] = [
        {
            "id": str(incident.id),
            "incident_type": incident.incident_type,
            "status": incident.status,
            "max_severity": incident.max_severity,
            "flagged_comment_count": incident.flagged_comment_count,
            "affected_post_count": incident.affected_post_count,
            "summary": incident.summary,
            "is_demo": True,
        }
        for incident in incidents
    ]
    return response
