"""Read-only Phase 3 Facebook Page-post retrieval and explicit demo fixtures.

Never accept a Meta URL or token from the browser. Only server-side stored Page
tokens are used, and cursor pagination never follows Meta-provided URLs.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit
import re

import httpx
from cryptography.fernet import Fernet, InvalidToken

from .config import Settings
from .facebook_service import MetaAPIError, graph_get


POST_FIELDS = "id,message,created_time,permalink_url,full_picture"
POST_PAGE_LIMIT = 25
PAGE_ID_RE = re.compile(r"^\d{3,32}$")


@dataclass(frozen=True)
class PagePostData:
    provider_post_id: str
    caption: str | None
    post_type: str
    thumbnail_url: str | None
    permalink: str | None
    published_at: datetime | None


@dataclass(frozen=True)
class PostBatch:
    posts: list[PagePostData]
    next_cursor: str | None


def decrypt_page_token(ciphertext: str, settings: Settings) -> str:
    """Failure never returns or logs the encrypted or plaintext token."""
    try:
        return Fernet(settings.facebook_token_encryption_key.encode("ascii")).decrypt(
            ciphertext.encode("ascii")
        ).decode("utf-8")
    except (InvalidToken, ValueError, TypeError, UnicodeError) as exc:
        raise ValueError("Stored Facebook credential cannot be decrypted. Reconnect your Page.") from None


def _https_url(value: object, *, facebook_only: bool = False) -> str | None:
    if not isinstance(value, str) or len(value) > 2048:
        return None
    try:
        p = urlsplit(value)
        if p.scheme != "https" or not p.hostname or p.username or p.password:
            return None
        if facebook_only and not (
            p.hostname == "facebook.com"
            or p.hostname.endswith(".facebook.com")
            or p.hostname == "fb.watch"
        ):
            return None
    except ValueError:
        return None
    return value


def normalize_post(item: object) -> PagePostData | None:
    if not isinstance(item, dict):
        return None
    post_id = item.get("id")
    if not isinstance(post_id, str) or not (1 <= len(post_id) <= 128):
        return None
    message = item.get("message")
    caption = message[:10000] if isinstance(message, str) and message.strip() else None
    picture = _https_url(item.get("full_picture"))
    permalink = _https_url(item.get("permalink_url"), facebook_only=True)
    published = None
    created = item.get("created_time")
    if isinstance(created, str):
        try:
            published = datetime.fromisoformat(created.replace("Z", "+00:00"))
            if published.tzinfo is None:
                published = published.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return PagePostData(
        provider_post_id=post_id,
        caption=caption,
        post_type="image" if picture else ("text" if caption else "unknown"),
        thumbnail_url=picture,
        permalink=permalink,
        published_at=published,
    )


def fetch_page_posts(
    client: httpx.Client,
    settings: Settings,
    page_id: str,
    page_token: str,
    *,
    after: str | None = None,
) -> PostBatch:
    """Fetch exactly one Graph page from a selected, authorized Facebook Page."""
    if not PAGE_ID_RE.fullmatch(page_id):
        raise MetaAPIError("Invalid Facebook Page ID", 400)
    if after is not None and (not after or len(after) > 512):
        raise MetaAPIError("Invalid Facebook pagination cursor", 400)
    params: dict[str, str | int] = {"fields": POST_FIELDS, "limit": POST_PAGE_LIMIT}
    if after is not None:
        params["after"] = after
    # This is Page-owned published content, not the wider Page feed/comments.
    data = graph_get(client, settings, f"{page_id}/published_posts", page_token, params=params)
    rows = data.get("data")
    if not isinstance(rows, list):
        raise MetaAPIError("Meta returned an invalid published-post list")
    posts: dict[str, PagePostData] = {}
    for item in rows:
        post = normalize_post(item)
        if post is not None:
            posts[post.provider_post_id] = post
    paging = data.get("paging")
    next_cursor = None
    if isinstance(paging, dict) and paging.get("next"):
        cursors = paging.get("cursors")
        value = cursors.get("after") if isinstance(cursors, dict) else None
        if isinstance(value, str) and 0 < len(value) <= 512 and value != after:
            next_cursor = value
    return PostBatch(posts=list(posts.values()), next_cursor=next_cursor)


# Explicitly fictional, stable fixture IDs for hackathon judging only.
_DEMO_CAPTIONS = (
    "Welcome to our community! This is a fictional SafeSphere AI test post.",
    "অনলাইনে নিরাপদ থাকার উপায় নিয়ে আপনার মতামত শেয়ার করুন। — Demo Data",
    "Be kind online. Share your ideas about creating a safer Facebook community.",
    "Banglish demo: Shobai mile online harassment bondho kori!",
    "Our community event is coming soon. What topics would you like to discuss?",
    "Thank you for supporting a safer digital Bangladesh. This is sample content.",
)


def demo_posts(now: datetime | None = None) -> PostBatch:
    reference = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    noon = reference.replace(hour=12, minute=0, second=0, microsecond=0)
    return PostBatch(
        posts=[
            PagePostData(
                provider_post_id=f"demo:safesphere-post-{i + 1}",
                caption=caption,
                post_type="text",
                thumbnail_url=None,
                permalink=None,
                published_at=noon - timedelta(days=i + 1),
            )
            for i, caption in enumerate(_DEMO_CAPTIONS)
        ],
        next_cursor=None,
    )
