"""PostgreSQL-backed Phase 4 acceptance test.

Runs ONLY when SAFESPHERE_RUN_DB_TESTS=1, against a disposable CI PostgreSQL
service. Does not call Meta and never uses real Facebook accounts or tokens.
"""
import os
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.db import SessionLocal
from app.main import app
from app.models import (
    Incident, Scan, ScanFinding, SocialAuthor, SocialComment,
    SocialConnection, SocialPost,
)


pytestmark = pytest.mark.skipif(
    os.getenv("SAFESPHERE_RUN_DB_TESTS") != "1",
    reason="Requires disposable test PostgreSQL and explicit SAFESPHERE_RUN_DB_TESTS=1",
)

ORIGIN = "http://localhost:3000"
PASSWORD = "safe-test-password-123456"


def new_test_account() -> tuple[TestClient, UUID]:
    client = TestClient(app, base_url=ORIGIN)
    result = client.post(
        "/auth/register",
        json={
            "email": "demo-test-" + uuid4().hex + "@example.org",
            "password": PASSWORD,
            "display_name": "Fictional Test User",
            "workspace_name": "Disposable CI Workspace",
        },
        headers={"Origin": ORIGIN},
    )
    assert result.status_code == 201, result.text
    me = result.json()
    assert me["role"] == "owner"
    return client, UUID(me["workspace_id"])


def seed_page_and_posts(workspace_id: UUID, count: int = 3) -> list[UUID]:
    connection_id = uuid4()
    post_ids = [uuid4() for _ in range(count)]
    with SessionLocal() as db:
        db.add(SocialConnection(
            id=connection_id,
            workspace_id=workspace_id,
            provider="facebook",
            provider_account_id="100" + uuid4().hex[:15],
            display_name="CI Fictional Page",
            status="connected",
            is_demo=False,  # Real-style *post* records; no Graph connection ever used.
            encrypted_token=None,
            capabilities={"selected": True, "read_only": True},
            granted_scopes=[],
        ))
        db.flush()
        for index, post_id in enumerate(post_ids):
            db.add(SocialPost(
                id=post_id,
                workspace_id=workspace_id,
                connection_id=connection_id,
                provider_post_id="test_" + str(post_id),
                caption="CI test post " + str(index + 1),
                post_type="text",
                is_demo=False,
            ))
        db.commit()
    return post_ids


def complete_clock_in_database(scan_id: UUID) -> None:
    with SessionLocal() as db:
        scan = db.get(Scan, scan_id)
        assert scan is not None
        scan.started_at = datetime.now(timezone.utc) - timedelta(seconds=45)
        db.commit()


def test_scan_persistence_timing_tenant_isolation_and_repeat_threshold():
    client, workspace_id = new_test_account()
    post_ids = seed_page_and_posts(workspace_id, 3)

    first = client.post(
        "/scans", json={"post_ids": [str(post_ids[0]), str(post_ids[1])]},
        headers={"Origin": ORIGIN},
    )
    assert first.status_code == 201, first.text
    scan_id = UUID(first.json()["id"])
    assert first.json()["status"] == "running"
    assert first.json()["is_demo"] is True
    assert first.json()["real_comments_fetched"] is False
    assert first.json()["ai_executed"] is False
    assert first.json()["estimated_demo_comments"] == 20

    pending = client.get("/scans/" + str(scan_id))
    assert pending.status_code == 200, pending.text
    assert pending.json()["findings"] == []
    assert pending.json()["statistics"] is None

    complete_clock_in_database(scan_id)
    finished = client.get("/scans/" + str(scan_id))
    assert finished.status_code == 200, finished.text
    data = finished.json()
    assert data["status"] == "completed"
    assert data["progress_percent"] == 100
    assert len(data["findings"]) == 20
    assert all(f["is_demo"] is True and f["source_type"] == "demo_fixture"
               and f["confidence"] is None for f in data["findings"])
    assert all(p["post_is_demo"] is False for p in data["selected_posts"])
    assert data["statistics"]["fictional_comments"] == 20
    assert data["statistics"]["flagged"] >= 10
    assert data["statistics"]["critical"] == 2
    assert data["statistics"]["repeat_accounts"]
    assert data["statistics"]["repeat_incidents"] == 0
    assert any(i["incident_type"] == "critical_threat" for i in data["incidents"])
    assert not any(i["incident_type"] == "repeat_harassment" for i in data["incidents"])

    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(SocialComment)
                         .where(SocialComment.connection_id == data["selected_posts"][0]["id"])) == 0
        comments = db.scalars(select(SocialComment).where(SocialComment.workspace_id == workspace_id)).all()
        assert len(comments) == 20
        assert all(c.is_demo and c.provider_comment_id.startswith("demo:") for c in comments)
        findings = db.scalars(select(ScanFinding).where(ScanFinding.scan_id == scan_id)).all()
        assert len(findings) == 20
        assert all(f.source_type == "demo_fixture" and f.model_name is None for f in findings)
        authors = db.scalars(select(SocialAuthor).where(SocialAuthor.workspace_id == workspace_id)).all()
        assert len(authors) == 5
        assert all(a.is_demo and a.identity_quality == "demo" for a in authors)

    # A different registered user cannot view this scan or scan this workspace's posts.
    outsider, outsider_workspace = new_test_account()
    assert outsider_workspace != workspace_id
    assert outsider.get("/scans/" + str(scan_id)).status_code == 404
    cross = outsider.post("/scans", json={"post_ids": [str(post_ids[0])]},
                         headers={"Origin": ORIGIN})
    assert cross.status_code == 409  # No Page selected in the outsider workspace.
    assert outsider.get("/scans").json()["scans"] == []

    # A subsequent 3-post run meets the explicit cross-post repeat-incident threshold.
    next_run = client.post(
        "/scans", json={"post_ids": [str(p) for p in post_ids]},
        headers={"Origin": ORIGIN},
    )
    assert next_run.status_code == 201, next_run.text
    next_id = UUID(next_run.json()["id"])
    complete_clock_in_database(next_id)
    summary = client.get("/scans/" + str(next_id)).json()
    assert summary["statistics"]["fictional_comments"] == 30
    assert summary["statistics"]["repeat_incidents"] >= 1
    assert any(i["incident_type"] == "repeat_harassment" for i in summary["incidents"])
    with SessionLocal() as db:
        incidents = db.scalars(select(Incident).where(Incident.scan_id == next_id)).all()
        assert all(i.is_demo for i in incidents)
        authors = db.scalars(select(SocialAuthor).where(SocialAuthor.workspace_id == workspace_id)).all()
        assert len(authors) == 5  # Reused fictional identities, never real Facebook users.

    client.close()
    outsider.close()
