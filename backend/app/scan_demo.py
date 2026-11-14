"""Deterministic, explicitly fictional Phase 4 harassment demo fixtures.

This module deliberately makes zero external requests and performs zero AI inference.
It NEVER reads real Facebook comments or attaches identities from Facebook users.
The only real input is the selected post IDs, to organize the demo examples.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
from math import floor
from typing import Iterable
from uuid import UUID


SCAN_SECONDS = 18
MAX_SCAN_POSTS = 20
MAX_HISTORY = 20
REPEAT_INCIDENT_MIN_POSTS = 3

HARMFUL_LABELS = frozenset({
    "bullying", "harassment", "sexual_harassment", "threat", "hate",
    "body_shaming", "intimidation", "spam_scam", "other",
})
SEVERITY_ORDER = {"none": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}

# Clearly fictional aliases only. These are NOT accounts discovered on Facebook.
DEMO_AUTHORS: dict[str, tuple[str, str]] = {
    "a": ("demo:account-a", "Demo Account A"),
    "b": ("demo:account-b", "Demo Account B"),
    "c": ("demo:account-c", "Demo Account C"),
    "d": ("demo:account-d", "Demo Account D"),
    "e": ("demo:account-e", "Demo Account E"),
}


@dataclass(frozen=True)
class DemoFinding:
    author_key: str
    text: str
    language_code: str
    label: str
    severity: str
    explanation: str


# Fixed, human-authored fixture labels. No model generated or classified these.
FIXTURES: tuple[DemoFinding, ...] = (
    DemoFinding(
        "a", "তুমি এখানে কিছুই বোঝো না, চুপ থাকো।",
        "bn", "bullying", "high", "Fictional example of belittling and silencing language.",
    ),
    DemoFinding(
        "b", "Nobody wants to hear your opinion here.",
        "en", "harassment", "medium", "Fictional example of personally targeted hostility.",
    ),
    DemoFinding(
        "c", "Shobai tomake niye hashe, post bondho koro.",
        "banglish", "bullying", "medium", "Fictional Banglish example of ridicule.",
    ),
    DemoFinding(
        "d", "Thanks for sharing this useful update!",
        "en", "safe", "none", "Fictional example of constructive engagement.",
    ),
    DemoFinding(
        "a", "Toke online e shanti te thakte dibo na.",
        "banglish", "intimidation", "high", "Fictional example of intimidation.",
    ),
    DemoFinding(
        "e", "ব্যক্তিগত আক্রমণ না করে আলোচনায় থাকি।",
        "bn", "safe", "none", "Fictional example of constructive discussion.",
    ),
    DemoFinding(
        "b", "If you post again, I'll find you and hurt you.",
        "en", "threat", "critical", "Fictional example of a direct threat, not a real threat report.",
    ),
    DemoFinding(
        "c", "এমন বাজে পোস্ট আর দিয়ো না।",
        "bn", "harassment", "low", "Fictional example of a hostile reply.",
    ),
    DemoFinding(
        "d", "Can you clarify when the event starts?",
        "en", "safe", "none", "Fictional example of an ordinary question.",
    ),
    DemoFinding(
        "e", "Eta pura faltu, tomar kono joggota nai.",
        "banglish", "bullying", "medium", "Fictional example of an insulting remark.",
    ),
)


def fixture_comments_per_post() -> int:
    return len(FIXTURES)


def progress(
    started_at: datetime, duration_seconds: int, estimated_count: int,
    now: datetime | None = None,
) -> tuple[int, int, bool]:
    """Return clock-derived percent, fictional processed count, and completion.

    Never claims real comment processing; the counter is demo-animation only.
    """
    if duration_seconds < 1:
        raise ValueError("Demo duration must be positive")
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None or started_at.tzinfo is None:
        raise ValueError("Progress dates must have time zones")
    elapsed = max(0.0, (current - started_at).total_seconds())
    fraction = min(1.0, elapsed / duration_seconds)
    complete = fraction >= 1.0
    return (
        min(100, floor(fraction * 100)),
        min(estimated_count, floor(fraction * estimated_count)),
        complete,
    )


def demo_statistics(records: Iterable[dict]) -> dict:
    """Summarize only persisted scripted findings, never real comment totals.

    Each record has label, severity, language_code, author_id, post_id,
    and optionally author_name. Repeat activity is visible from >=2 distinct
    selected posts; a repeat-harassment INCIDENT requires >=3 distinct posts.
    """
    rows = list(records)
    severity = {key: 0 for key in SEVERITY_ORDER}
    languages = {key: 0 for key in ("bn", "en", "banglish", "mixed", "unknown")}
    labels: dict[str, int] = {}
    by_author: dict[str, dict] = {}
    flagged = 0
    critical = 0
    for row in rows:
        label = str(row["label"])
        level = str(row["severity"])
        lang = str(row["language_code"])
        severity[level] = severity.get(level, 0) + 1
        languages[lang] = languages.get(lang, 0) + 1
        labels[label] = labels.get(label, 0) + 1
        if label not in HARMFUL_LABELS:
            continue
        flagged += 1
        critical += int(level == "critical")
        author_id = row.get("author_id")
        if not author_id:
            continue
        key = str(author_id)
        group = by_author.setdefault(key, {
            "author_id": key,
            "display_name": str(row.get("author_name") or "Fictional demo account"),
            "flagged_comments": 0,
            "posts": set(),
            "max_severity": "low",
        })
        group["flagged_comments"] += 1
        group["posts"].add(str(row["post_id"]))
        if SEVERITY_ORDER[level] > SEVERITY_ORDER[group["max_severity"]]:
            group["max_severity"] = level

    repeat_accounts = [
        {
            "author_id": group["author_id"],
            "display_name": group["display_name"],
            "flagged_comments": group["flagged_comments"],
            "affected_posts": len(group["posts"]),
            "max_severity": group["max_severity"],
            "meets_incident_threshold": len(group["posts"]) >= REPEAT_INCIDENT_MIN_POSTS,
        }
        for group in by_author.values()
        if len(group["posts"]) >= 2
    ]
    repeat_accounts.sort(key=lambda x: (-x["affected_posts"], -x["flagged_comments"], x["display_name"]))
    return {
        "fictional_comments": len(rows),
        "flagged": flagged,
        "safe_or_uncertain": len(rows) - flagged,
        "critical": critical,
        "severity": severity,
        "languages": languages,
        "labels": labels,
        "repeat_accounts": repeat_accounts,
        "repeat_incidents": sum(1 for a in repeat_accounts if a["meets_incident_threshold"]),
    }
