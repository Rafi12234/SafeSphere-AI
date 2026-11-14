"""Server-side Facebook Login for Business and Meta Graph API operations.

Never log authorization codes, user/Page tokens, App Secrets, or raw Meta URLs
containing credentials. Network requests go only to fixed Meta hosts.
"""
import hashlib
import hmac
import re
import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet
from fastapi import HTTPException

from .config import Settings


REQUIRED_PERMISSIONS = ("pages_show_list", "pages_read_engagement")
VERSION_RE = re.compile(r"^v[0-9]+\.[0-9]+$")
MAX_PAGES = 500


class MetaAPIError(Exception):
    """Safe-to-display failure: never contains Meta's raw error response or tokens."""

    def __init__(self, detail: str, status: int = 502):
        super().__init__(detail)
        self.detail = detail
        self.status = status


@dataclass(frozen=True)
class MetaPage:
    page_id: str
    name: str
    tasks: list[str]
    access_token: str


def facebook_ready(settings: Settings) -> bool:
    values = (
        settings.facebook_app_id,
        settings.facebook_app_secret,
        settings.facebook_config_id,
        settings.facebook_token_encryption_key,
    )
    return bool(
        all(value and not value.startswith(("YOUR_", "REPLACE_")) for value in values)
        and settings.facebook_redirect_uri
        and VERSION_RE.fullmatch(settings.facebook_graph_version)
    )


def require_facebook_setup(settings: Settings) -> None:
    if not facebook_ready(settings):
        raise HTTPException(503, "Facebook OAuth is not configured on the backend")
    try:
        Fernet(settings.facebook_token_encryption_key.encode("ascii"))
    except Exception:
        # Uniform message: configuration keys should not be copied into error logs.
        raise HTTPException(503, "Facebook encryption key is invalid") from None


def encrypt_page_token(token: str, settings: Settings) -> str:
    return Fernet(settings.facebook_token_encryption_key.encode("ascii")).encrypt(token.encode("utf-8")).decode("ascii")


def digest_state(state: str) -> str:
    return hashlib.sha256(state.encode("utf-8")).hexdigest()


def new_state() -> str:
    return secrets.token_urlsafe(48)


def authorization_url(settings: Settings, state: str) -> str:
    """Use config_id (the user's selected permissions), NOT a hard-coded broader scope list."""
    params = {
        "client_id": settings.facebook_app_id,
        "config_id": settings.facebook_config_id,
        "redirect_uri": settings.facebook_redirect_uri,
        "response_type": "code",
        "override_default_response_type": "true",
        "state": state,
    }
    return f"https://www.facebook.com/{settings.facebook_graph_version}/dialog/oauth?{urlencode(params)}"


def _graph_base(settings: Settings) -> str:
    if not VERSION_RE.fullmatch(settings.facebook_graph_version):
        raise MetaAPIError("Invalid configured Graph API version", 503)
    return f"https://graph.facebook.com/{settings.facebook_graph_version}"


def _get_json(client: httpx.Client, url: str, *, params: dict[str, str | int]) -> dict:
    try:
        response = client.get(url, params=params, timeout=15.0, follow_redirects=False)
        data = response.json()
    except (httpx.RequestError, ValueError) as exc:
        raise MetaAPIError("Could not contact Meta. Please retry the connection.") from None
    if not isinstance(data, dict):
        raise MetaAPIError("Meta returned an unexpected response.")
    if response.status_code >= 400 or "error" in data:
        error = data.get("error")
        code = error.get("code") if isinstance(error, dict) else None
        # Do NOT forward arbitrary error.message; it may contain sensitive values.
        if code in (190, 102):
            raise MetaAPIError("Facebook authorization expired or was rejected. Reconnect your Page.", 400)
        if code in (10, 200):
            raise MetaAPIError("Your Facebook account lacks the required Page permissions.", 403)
        raise MetaAPIError("Facebook rejected this API request. Check app access and permissions.", 502)
    return data


def exchange_code(client: httpx.Client, settings: Settings, code: str) -> str:
    data = _get_json(
        client,
        f"{_graph_base(settings)}/oauth/access_token",
        params={
            "client_id": settings.facebook_app_id,
            "client_secret": settings.facebook_app_secret,
            "redirect_uri": settings.facebook_redirect_uri,
            "code": code,
        },
    )
    token = data.get("access_token")
    if not isinstance(token, str) or not token:
        raise MetaAPIError("Facebook did not return a user access token")
    return token


def maybe_exchange_long_lived(client: httpx.Client, settings: Settings, token: str) -> str:
    """Ordinary user token → long-lived if supported; Business Login tokens may not exchange."""
    try:
        data = _get_json(
            client,
            f"{_graph_base(settings)}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.facebook_app_id,
                "client_secret": settings.facebook_app_secret,
                "fb_exchange_token": token,
            },
        )
        result = data.get("access_token")
        return result if isinstance(result, str) and result else token
    except MetaAPIError:
        return token  # Never discard a usable Business Login user token.


def _app_secret_proof(token: str, settings: Settings) -> str:
    return hmac.new(settings.facebook_app_secret.encode(), token.encode(), hashlib.sha256).hexdigest()


def graph_get(client: httpx.Client, settings: Settings, path: str, token: str, *, params: dict[str, str | int] | None = None) -> dict:
    # All paths supplied by this module are static; never accept user input as URL/path.
    return _get_json(
        client,
        f"{_graph_base(settings)}/{path.lstrip('/')}",
        params={
            **(params or {}),
            "access_token": token,
            "appsecret_proof": _app_secret_proof(token, settings),
        },
    )


def granted_permissions(client: httpx.Client, settings: Settings, user_token: str) -> list[str]:
    try:
        data = graph_get(client, settings, "me/permissions", user_token)
    except MetaAPIError:
        return []  # Unknown is NOT the same as granted.
    items = data.get("data", [])
    return sorted({
        x["permission"]
        for x in items if isinstance(x, dict)
        and x.get("status") == "granted"
        and isinstance(x.get("permission"), str)
    }) if isinstance(items, list) else []


def discover_pages(client: httpx.Client, settings: Settings, user_token: str) -> list[MetaPage]:
    pages: dict[str, MetaPage] = {}
    after: str | None = None
    # Explicit cursor-only pagination; never follow untrusted paging.next URLs.
    for _ in range(5):
        args: dict[str, str | int] = {"fields": "id,name,access_token,tasks", "limit": 100}
        if after:
            args["after"] = after
        data = graph_get(client, settings, "me/accounts", user_token, params=args)
        rows = data.get("data", [])
        if not isinstance(rows, list):
            raise MetaAPIError("Facebook returned an invalid Page list")
        for item in rows:
            if not isinstance(item, dict):
                continue
            page_id, name, token = item.get("id"), item.get("name"), item.get("access_token")
            if not (isinstance(page_id, str) and page_id and isinstance(name, str) and name
                    and isinstance(token, str) and token):
                continue
            tasks = item.get("tasks")
            pages[page_id] = MetaPage(
                page_id=page_id,
                name=name,
                access_token=token,
                tasks=[t for t in tasks if isinstance(t, str)] if isinstance(tasks, list) else [],
            )
            if len(pages) >= MAX_PAGES:
                return list(pages.values())
        paging = data.get("paging", {})
        cursors = paging.get("cursors", {}) if isinstance(paging, dict) else {}
        next_cursor = cursors.get("after") if isinstance(cursors, dict) else None
        # Graph normally reports a paging.next URL only when another page exists.
        if not (isinstance(paging, dict) and paging.get("next") and isinstance(next_cursor, str) and next_cursor != after):
            break
        after = next_cursor
    return list(pages.values())
