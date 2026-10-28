"""Recent + frequent food suggestions. Mirrors getQuickAddSuggestions."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import datetime
from typing import Any

from ..sections import SECTION_KEYS
from .nutrition import safe_num

SUGGESTIONS_PER_SECTION = 4


def _parse_ts(value: str) -> datetime:
    # Supabase returns ISO-8601 with a trailing Z or +00:00 offset.
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def rank_suggestions(
    rows_newest_first: Iterable[Mapping[str, Any]], now: datetime
) -> dict[str, list[dict[str, Any]]]:
    """Rank foods per section by recency-weighted frequency.

    score = count / (1 + days_since_last_logged / 7). Foods logged often AND
    recently win; a single very recent food still surfaces and stale ones
    decay out on their own, so there is no separate 'recent' vs 'frequent'
    list to reconcile. Rows must arrive newest-first, so the first row seen
    per (section, food) is already its most recent log.
    """
    groups: dict[tuple[str, str], dict[str, Any]] = {}

    for row in rows_newest_first:
        section = row["section"]
        key = (section, str(row["food_name"]).lower())
        existing = groups.get(key)
        if existing:
            existing["count"] += 1
            continue
        groups[key] = {
            "section": section,
            "count": 1,
            "last_created_at": _parse_ts(str(row["created_at"])),
            "latest": {
                "foodName": row["food_name"],
                "qty": safe_num(row.get("qty")),
                "qtyLabel": row["qty_label"],
                "unit": row["unit"],
                "carbs": safe_num(row.get("carbs")),
                "protein": safe_num(row.get("protein")),
                "fat": safe_num(row.get("fat")),
                "calories": safe_num(row.get("calories")),
            },
        }

    out: dict[str, list[dict[str, Any]]] = {s: [] for s in SECTION_KEYS}
    by_section: dict[str, list[dict[str, Any]]] = {s: [] for s in SECTION_KEYS}
    for g in groups.values():
        if g["section"] in by_section:
            by_section[g["section"]].append(g)

    for section, section_groups in by_section.items():
        scored = []
        for g in section_groups:
            days_ago = (now - g["last_created_at"]).total_seconds() / 86_400
            scored.append((g["count"] / (1 + days_ago / 7), g))
        scored.sort(key=lambda pair: pair[0], reverse=True)  # stable: ties keep newest-first order
        out[section] = [g["latest"] for _, g in scored[:SUGGESTIONS_PER_SECTION]]
    return out
