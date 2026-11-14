"""Phase 3 unit tests. No live Meta requests or real credentials required."""
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from cryptography.fernet import Fernet

from app.config import Settings
from app.main import app
from app.models import SocialPost
from app.posts_service import (
    POST_FIELDS,
    decrypt_page_token,
    demo_posts,
    fetch_page_posts,
    normalize_post,
)
from app.facebook_service import MetaAPIError


def settings() -> Settings:
    return Settings(
        database_url="postgresql+psycopg://unused:unused@localhost/safesphere_ai",
        jwt_secret="phase-3-test-jwt-secret-at-least-32-characters",
        facebook_app_id="dummy-app-id",
        facebook_app_secret="dummy-app-secret",
        facebook_config_id="dummy-config-id",
        facebook_token_encryption_key=Fernet.generate_key().decode(),
    )


def test_post_normalization_reads_only_post_metadata_and_safe_links():
    post = normalize_post({
        "id": "100_200",
        "message": "হ্যালো! Facebook post",
        "created_time": "2026-11-12T12:00:00+0000",
        "permalink_url": "https://www.facebook.com/somepage/posts/200",
        "full_picture": "https://scontent.cdn.example/test.jpg",
        "comments": {"data": [{"message": "should-not-be-copied"}]},
        "access_token": "should-not-be-copied",
    })
    assert post is not None
    assert post.provider_post_id == "100_200"
    assert post.caption == "হ্যালো! Facebook post"
    assert post.post_type == "image"
    assert post.published_at is not None and post.published_at.utcoffset().total_seconds() == 0
    assert "should-not-be-copied" not in repr(post)
    assert post.permalink == "https://www.facebook.com/somepage/posts/200"


def test_invalid_post_values_are_skipped_and_unsafe_urls_removed():
    assert normalize_post({"id": None}) is None
    assert normalize_post("not-a-post") is None
    post = normalize_post({
        "id": "321_123",
        "message": "",
        "full_picture": "javascript:alert(1)",
        "permalink_url": "https://evil.example/phishing",
        "created_time": "invalid",
    })
    assert post is not None
    assert post.post_type == "unknown"
    assert post.thumbnail_url is None
    assert post.permalink is None
    assert post.published_at is None


def test_meta_page_post_sync_uses_fixed_graph_endpoint_and_cursor_not_next_url():
    s = settings()
    requests = []

    def meta(request: httpx.Request):
        requests.append(request)
        if request.url.params.get("after") == "next-page":
            return httpx.Response(200, json={"data": [
                {"id": "123456_2", "message": "Second page"}
            ]})
        return httpx.Response(200, json={
            "data": [
                {"id": "123456_1", "message": "First page"},
                {"id": "123456_1", "message": "Updated first page"},
                {"message": "Missing post ID"},
            ],
            "paging": {
                "next": "https://evil.example/steal-access-token",
                "cursors": {"after": "next-page"},
            },
        })

    with httpx.Client(transport=httpx.MockTransport(meta)) as client:
        first = fetch_page_posts(client, s, "123456", "private-page-token")
        assert first.next_cursor == "next-page"
        assert len(first.posts) == 1
        assert first.posts[0].caption == "Updated first page"
        second = fetch_page_posts(client, s, "123456", "private-page-token", after=first.next_cursor)
        assert second.next_cursor is None
        assert second.posts[0].provider_post_id == "123456_2"

    assert len(requests) == 2
    assert all(req.url.host == "graph.facebook.com" for req in requests)
    assert all(req.url.path.endswith("/123456/published_posts") for req in requests)
    assert requests[0].url.params["fields"] == POST_FIELDS
    assert requests[0].url.params["limit"] == "25"
    assert requests[0].url.params["appsecret_proof"]
    assert requests[1].url.params["after"] == "next-page"


def test_invalid_page_id_and_cursor_block_requests():
    s = settings()
    calls = []

    def meta(request: httpx.Request):
        calls.append(request)
        return httpx.Response(200, json={"data": []})

    with httpx.Client(transport=httpx.MockTransport(meta)) as client:
        with pytest.raises(MetaAPIError):
            fetch_page_posts(client, s, "../me/accounts", "token")
        with pytest.raises(MetaAPIError):
            fetch_page_posts(client, s, "123456", "token", after="x" * 513)
    assert calls == []


def test_no_arbitrary_cursor_pagination_without_next_link():
    s = settings()

    def meta(request: httpx.Request):
        return httpx.Response(200, json={
            "data": [{"id": "123_1", "message": "Only post"}],
            "paging": {"cursors": {"after": "cursor-without-next"}},
        })

    with httpx.Client(transport=httpx.MockTransport(meta)) as client:
        batch = fetch_page_posts(client, s, "123", "token")
    assert batch.next_cursor is None


def test_fictional_demo_posts_are_labeled_and_have_no_real_meta_links():
    batch = demo_posts(datetime(2026, 11, 14, tzinfo=timezone.utc))
    assert len(batch.posts) >= 5
    assert batch.next_cursor is None
    assert len(set(p.provider_post_id for p in batch.posts)) == len(batch.posts)
    assert all(p.provider_post_id.startswith("demo:") for p in batch.posts)
    assert all(p.permalink is None and p.thumbnail_url is None for p in batch.posts)
    assert all("Demo" in p.caption or "demo" in p.caption.lower() or p.provider_post_id.startswith("demo:") for p in batch.posts)


def test_page_token_decryption_and_wrong_key_failure():
    s = settings()
    token = "PRIVATE-FACEBOOK-PAGE-TOKEN"
    cipher = Fernet(s.facebook_token_encryption_key.encode()).encrypt(token.encode()).decode()
    assert decrypt_page_token(cipher, s) == token
    s2 = settings()
    with pytest.raises(ValueError, match="Reconnect"):
        decrypt_page_token(cipher, s2)


def test_phase_three_routes_and_social_posts_mapping_exist():
    routes = {(route.path, method) for route in app.routes for method in getattr(route, "methods", [])}
    assert ("/posts", "GET") in routes
    assert ("/posts/sync", "POST") in routes
    assert SocialPost.__tablename__ == "social_posts"
    assert "provider_post_id" in SocialPost.__table__.columns
    assert "encrypted_token" not in SocialPost.__table__.columns
