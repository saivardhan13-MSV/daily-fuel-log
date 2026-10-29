"""Logging streak: consecutive days, ending today or yesterday, with at least
one logged entry. (Ported from the app's original TypeScript getStreak.)"""

from __future__ import annotations

from collections.abc import Iterable
from datetime import date, timedelta

from .dates import format_date


def compute_streak(logged_dates: Iterable[str], today: date) -> int:
    """Consecutive logged days ending today or yesterday.

    A day with nothing logged yet doesn't break an in-progress streak until
    it actually passes, so if today is empty the count starts from yesterday.
    """
    logged = set(logged_dates)
    if not logged:
        return 0

    cursor = today
    if format_date(cursor) not in logged:
        cursor -= timedelta(days=1)

    streak = 0
    while format_date(cursor) in logged:
        streak += 1
        cursor -= timedelta(days=1)
    return streak
