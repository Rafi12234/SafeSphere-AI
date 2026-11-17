import json
from urllib.parse import parse_qs, urlsplit

import httpx
from cryptography.fernet import Fernet

from app.facebook_service import (
    MetaAPIError,
    authorization_url,
    digest_state,
    discover_pages,
    encrypt_page_token,
    exchange_code,
    facebook_ready,
    granted_permissions,
    new_state,
)
from app.config import Settings


def settings() -> Settings:
    return Settings(
        database_url="postgresql+psycopg://unused:unused@localhost/safesphere_ai",
        jwt_secret="test-jwt-secret-replace-test-jwt-secret",
        facebook_app_id="test-app-id",
        facebook_app_secret="test-app-secret",
        facebook_config_id="test-config-id",
        facebook_redirect_uri="http://localhost:3000/api/facebook/callback",
        facebook_graph_version="v27.0",
        facebook_token_encryption_key=Fernet.generate_key().decode(),
    )


def test_authorization_url_contains_state_config_and_code_not_secret():
    s = settings()
    state = new_state()
    url = authorization_url(s, state)
    query = parse_qs(urlsplit(url).query)
    assert urlsplit(url).netloc == "www.facebook.com"
    assert query["state"] == [state]
    assert query["response_type"] == ["code"]
    assert query["config_id"] == [s.facebook_config_id]
    assert query["redirect_uri"] == [s.facebook_redirect_uri]
    assert "scope" not in query  # Business Login config defines requested scopes.
    assert s.facebook_app_secret not in url
    assert len(state) >= 40
    assert digest_state(state) != state
    assert len(digest_state(state)) == 64
    assert facebook_ready(s)


def test_fernet_encryption_never_stores_plaintext():
    s = settings()
    plaintext = "EAATEST-PRIVATE-PAGE-TOKEN"
    ciphertext = encrypt_page_token(plaintext, s)
    assert ciphertext != plaintext
    assert plaintext not in ciphertext
    assert Fernet(s.facebook_token_encryption_key.encode()).decrypt(ciphertext.encode()).decode() == plaintext


def test_code_exchange_uses_correct_callback_and_never_returns_raw_meta_message():
    s = settings()
    requests_seen = []

    def exchange(request: httpx.Request):
        requests_seen.append(request)
        return httpx.Response(200, json={"access_token": "short-lived-token"})

    with httpx.Client(transport=httpx.MockTransport(exchange)) as client:
        assert exchange_code(client, s, "test-code") == "short-lived-token"
    assert requests_seen[0].url.path.endswith("/oauth/access_token")
    assert requests_seen[0].url.params["code"] == "test-code"
    assert requests_seen[0].url.params["redirect_uri"] == s.facebook_redirect_uri


def test_page_discovery_skips_missing_tokens_and_paginates_with_cursors():
    s = settings()
    calls = []

    def meta(request: httpx.Request):
        assert request.url.host == "graph.facebook.com"
        assert request.url.params.get("appsecret_proof")
        calls.append(dict(request.url.params))
        if request.url.params.get("after") == "next-cursor":
            return httpx.Response(200, json={"data": [
                {"id": "200", "name": "Page 2", "access_token": "token-2", "tasks": ["MANAGE", "MODERATE"]}
            ]})
        return httpx.Response(200, json={
            "data": [
                {"id": "100", "name": "Page 1", "access_token": "token-1", "tasks": ["MODERATE"]},
                {"id": "101", "name": "Missing token"},
            ],
            "paging": {"next": "https://graph.facebook.com/example", "cursors": {"after": "next-cursor"}},
        })

    with httpx.Client(transport=httpx.MockTransport(meta)) as client:
        pages = discover_pages(client, s, "user-token")
    assert [p.page_id for p in pages] == ["100", "200"]
    assert len(calls) == 2
    assert calls[1]["after"] == "next-cursor"


def test_permissions_are_not_assumed_granted():
    s = settings()

    def meta(request: httpx.Request):
        return httpx.Response(200, json={"data": [
            {"permission": "pages_show_list", "status": "granted"},
            {"permission": "pages_read_engagement", "status": "declined"},
        ]})

    with httpx.Client(transport=httpx.MockTransport(meta)) as client:
        assert granted_permissions(client, s, "user-token") == ["pages_show_list"]


def test_meta_error_never_exposes_sensitive_raw_response():
    s = settings()

    def meta(request: httpx.Request):
        return httpx.Response(400, json={"error": {
            "code": 190, "message": "Token contains private-access-token"
        }})

    with httpx.Client(transport=httpx.MockTransport(meta)) as client:
        try:
            exchange_code(client, s, "shortcode")
        except MetaAPIError as exc:
            assert "private-access-token" not in exc.detail
            assert exc.status == 400
        else:
            raise AssertionError("Expected MetaAPIError")



def test_page_only_discovery_rejects_profile_only_account():
    """Facebook Login authenticates a person, but /me/accounts must return
    an authorized Page AND Page token. Personal profile identity is never saved."""
    s = settings()
    requests_seen = []

    def personal_only(request: httpx.Request):
        requests_seen.append(request)
        # A personal profile is NOT a Page, and cannot supply a Page token.
        return httpx.Response(200, json={"data": [
            {"id": "111111", "name": "Personal Facebook Account"}
        ]})

    with httpx.Client(transport=httpx.MockTransport(personal_only)) as client:
        assert discover_pages(client, s, "user-token") == []
    assert len(requests_seen) == 1
    assert requests_seen[0].url.path.endswith("/me/accounts")


def test_page_discovery_empty_page_list_returns_no_connections():
    s = settings()

    with httpx.Client(transport=httpx.MockTransport(
        lambda request: httpx.Response(200, json={"data": []})
    )) as client:
        assert discover_pages(client, s, "user-token") == []
