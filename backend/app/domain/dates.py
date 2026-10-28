"""Calendar-date helpers.

Every date in this app is a plain local calendar day (YYYY-MM-DD) matching
the Postgres `date` columns. Nothing here converts through UTC timestamps, so
a date can never shift by a day around midnight or a DST change.
"""

from __future__ import annotations

import re
from datetime import date, timedelta

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def is_valid_date_string(value: object) -> bool:
    """True only for real calendar dates. A regex alone would accept
    '2026-02-30' and '2026-13-40', so the string is also parsed."""
    if not isinstance(value, str) or not _DATE_RE.match(value):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


def parse_date(value: str) -> date:
    return date.fromisoformat(value)


def format_date(d: date) -> str:
    return d.isoformat()


def range_bounds(days: int, today: date) -> tuple[str, str]:
    """The last `days` calendar days ending `today`, inclusive of both ends.

    One definition shared by every bounded history query, so a 30-day fetch
    of daily totals and of weight logs always cover exactly the same dates.
    """
    if days < 1:
        raise ValueError("days must be >= 1")
    return format_date(today - timedelta(days=days - 1)), format_date(today)


def date_sequence(start: str, end: str) -> list[str]:
    """Every calendar date from start to end inclusive, oldest first."""
    cursor, last = parse_date(start), parse_date(end)
    out: list[str] = []
    while cursor <= last:
        out.append(format_date(cursor))
        cursor += timedelta(days=1)
    return out


def days_between(a: str, b: str) -> int:
    """Whole-day difference a - b between two YYYY-MM-DD strings."""
    return (parse_date(a) - parse_date(b)).days


def resolve_future_check_reference(client_today: str | None, server_today: str) -> str:
    """Pick the 'today' used to reject future dates.

    The server may run in UTC while the user's real local date is a day ahead
    or behind for some hours. No real timezone differs from UTC by more than
    one calendar day, so a client-supplied 'today' is trusted only inside
    that +/-1 day window; anything else is a spoofed value and falls back to
    the server's own date. A forged value can therefore never unlock an
    arbitrary future date, only the same slack a real timezone would get.
    """
    if (
        client_today
        and is_valid_date_string(client_today)
        and abs(days_between(client_today, server_today)) <= 1
    ):
        return client_today
    return server_today
