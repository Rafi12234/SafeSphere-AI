"""Phase 4 pure unit tests: no PostgreSQL, no Meta requests and no real AI."""
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.main import app
from app.models import Incident, IncidentFinding, Scan, ScanFinding, ScanPost, SocialAuthor, SocialComment
from app.scan_demo import (
    DEMO_AUTHORS, FIXTURES, HARMFUL_LABELS, MAX_SCAN_POSTS,
    REPEAT_INCIDENT_MIN_POSTS, SCAN_SECONDS, demo_statistics, progress,
)
from app.scans import CreateScanInput


def test_demo_fixtures_use_three_languages_and_scripted_non_ai_labels():
    assert len(FIXTURES) >= 8
    assert {"bn", "banglish", "en"}.issubset({f.language_code for f in FIXTURES})
    assert {"low", "medium", "high", "critical", "none"}.issubset(
        {f.severity for f in FIXTURES}
    )
    assert all(f.author_key in DEMO_AUTHORS for f in FIXTURES)
    assert all(identity[0].startswith("demo:") and name.startswith("Demo ")
               for identity in DEMO_AUTHORS.values() for name in [identity[1]])
    assert all(f.label == "safe" or f.label in HARMFUL_LABELS for f in FIXTURES)
    assert any(f.label == "threat" and f.severity == "critical" for f in FIXTURES)


def test_simulated_clock_progress_and_processed_count():
    started = datetime(2026, 11, 15, 10, tzinfo=timezone.utc)
    assert progress(started, 20, 100, started) == (0, 0, False)
    assert progress(started, 20, 100, started + timedelta(seconds=10)) == (50, 50, False)
    assert progress(started, 20, 100, started + timedelta(seconds=20)) == (100, 100, True)
    assert progress(started, 20, 100, started + timedelta(hours=1)) == (100, 100, True)
    assert progress(started, 20, 100, started - timedelta(minutes=1)) == (0, 0, False)
    assert SCAN_SECONDS >= 10


def test_progress_rejects_invalid_duration_and_untimed_datetimes():
    started = datetime(2026, 11, 15, tzinfo=timezone.utc)
    with pytest.raises(ValueError):
        progress(started, 0, 10)
    with pytest.raises(ValueError):
        progress(started.replace(tzinfo=None), 10, 10, started)


def demo_records(post_count: int) -> list[dict]:
    return [
        {
            "author_id": "demo-account-a",
            "author_name": "Demo Account A",
            "post_id": str(index),
            "label": "harassment",
            "severity": "high",
            "language_code": "banglish",
        }
        for index in range(post_count)
    ] + [
        {
            "author_id": "demo-account-b",
            "author_name": "Demo Account B",
            "post_id": str(index),
            "label": "safe",
            "severity": "none",
            "language_code": "en",
        }
        for index in range(post_count)
    ]


def test_repeat_activity_with_two_posts_is_not_repeat_incident():
    summary = demo_statistics(demo_records(2))
    assert summary["fictional_comments"] == 4
    assert summary["flagged"] == 2
    assert summary["safe_or_uncertain"] == 2
    assert len(summary["repeat_accounts"]) == 1
    assert summary["repeat_accounts"][0]["affected_posts"] == 2
    assert summary["repeat_accounts"][0]["meets_incident_threshold"] is False
    assert summary["repeat_incidents"] == 0
    assert REPEAT_INCIDENT_MIN_POSTS == 3


def test_repeat_incident_with_three_different_posts_only():
    records = demo_records(3)
    summary = demo_statistics(records)
    assert summary["repeat_incidents"] == 1
    assert summary["repeat_accounts"][0]["meets_incident_threshold"] is True
    # Repeated labels on one post must not manufacture three different posts.
    duplicates = [dict(records[0]) for _ in range(10)]
    assert demo_statistics(duplicates)["repeat_accounts"] == []


def test_statistics_severity_languages_and_critical_counts():
    sample = [
        {"label": "threat", "severity": "critical", "language_code": "en",
         "author_id": "a", "author_name": "Demo Account A", "post_id": "p1"},
        {"label": "safe", "severity": "none", "language_code": "bn",
         "author_id": "b", "author_name": "Demo Account B", "post_id": "p2"},
        {"label": "bullying", "severity": "medium", "language_code": "banglish",
         "author_id": "a", "author_name": "Demo Account A", "post_id": "p2"},
    ]
    stats = demo_statistics(sample)
    assert stats["critical"] == 1
    assert stats["severity"]["critical"] == 1
    assert stats["languages"]["banglish"] == 1
    assert stats["labels"]["safe"] == 1
    assert stats["repeat_accounts"][0]["affected_posts"] == 2


def test_scan_input_rejects_empty_or_excessive_posts():
    assert CreateScanInput(post_ids=[uuid4(), uuid4()]).post_ids
    with pytest.raises(ValidationError):
        CreateScanInput(post_ids=[])
    with pytest.raises(ValidationError):
        CreateScanInput(post_ids=[uuid4() for _ in range(MAX_SCAN_POSTS + 1)])


def test_existing_schema_mappings_and_scan_routes():
    routes = {(route.path, method) for route in app.routes for method in getattr(route, "methods", [])}
    assert ("/scans", "POST") in routes
    assert ("/scans", "GET") in routes
    assert ("/scans/{scan_id}", "GET") in routes
    assert ("/posts", "GET") in routes
    assert ("/posts/sync", "POST") in routes

    assert Scan.__tablename__ == "scans"
    assert ScanPost.__tablename__ == "scan_posts"
    assert ScanFinding.__tablename__ == "scan_findings"
    assert SocialComment.__tablename__ == "social_comments"
    assert SocialAuthor.__tablename__ == "social_authors"
    assert Incident.__tablename__ == "incidents"
    assert IncidentFinding.__tablename__ == "incident_findings"
    assert "model_name" in ScanFinding.__table__.columns
    assert "is_demo" in SocialComment.__table__.columns
    assert "is_demo" in Incident.__table__.columns
