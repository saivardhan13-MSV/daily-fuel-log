"""Per-day totals for the Trends page. Mirrors getRecentDailyTotals."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

from .dates import date_sequence
from .nutrition import safe_num


def build_daily_totals(
    rows: Iterable[Mapping[str, Any]], start: str, end: str
) -> list[dict[str, Any]]:
    """One row per calendar day in [start, end], oldest first.

    `logged` is True only when at least one entry exists for that date. It is
    deliberately NOT inferred from calories > 0: a day with nothing logged is
    zero-filled but logged=False, which is what lets averages and target-hit
    counts ignore days the user didn't log without mistaking them for a
    genuine zero-calorie day.
    """
    by_date: dict[str, dict[str, Any]] = {}
    for row in rows:
        key = str(row["entry_date"])
        day = by_date.setdefault(
            key,
            {"date": key, "cal": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "logged": True},
        )
        day["cal"] += safe_num(row.get("calories"))
        day["protein"] += safe_num(row.get("protein"))
        day["carbs"] += safe_num(row.get("carbs"))
        day["fat"] += safe_num(row.get("fat"))

    return [
        by_date.get(d)
        or {"date": d, "cal": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "logged": False}
        for d in date_sequence(start, end)
    ]
