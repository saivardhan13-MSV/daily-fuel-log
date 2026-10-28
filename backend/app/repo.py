"""Data access. Every query is scoped to the authenticated user in the WHERE
clause AND enforced again by Postgres RLS (the client carries the user's JWT),
so a bug in one layer cannot expose another user's rows."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Protocol

from postgrest.exceptions import APIError

from .domain.nutrition import safe_num
from .errors import DuplicateWeightDate, StorageError
from .sections import SECTION_KEYS

log = logging.getLogger(__name__)

ENTRY_COLUMNS ="id, section, food_name, qty, qty_label, unit, carbs, protein, fat, calories"


class Repository(Protocol):
    """What the API needs from storage. Routers depend on this, not on
    Supabase, which is what lets the tests run against an in-memory fake."""

    def entries_for_date(self, date: str) -> dict[str, list[dict[str, Any]]]: ...
    def custom_foods(self) -> list[dict[str, Any]]: ...
    def body_targets(self) -> dict[str, Any] | None: ...
    def water_intake_ml(self, date: str) -> float: ...
    def logged_dates(self, limit: int) -> list[str]: ...
    def quickadd_rows(self, limit: int) -> list[dict[str, Any]]: ...
    def daily_rows(self, start: str, end: str) -> list[dict[str, Any]]: ...
    def month_rows(self, start: str, end: str) -> list[dict[str, Any]]: ...
    def weight_logs(self, start: str, end: str) -> list[dict[str, Any]]: ...
    def nearest_prior_logged_date(self, before: str, section: str | None) -> str | None: ...
    def recent_logged_dates(self, before: str, limit: int) -> list[str]: ...

    # Writes. The repository stamps user_id and updated_at; callers never
    # supply either, so a request body cannot name another user's rows.
    def insert_entry(self, row: dict[str, Any]) -> str: ...
    def insert_entries(self, rows: list[dict[str, Any]]) -> int: ...
    def delete_entry(self, entry_id: str) -> None: ...
    def delete_day(self, date: str) -> None: ...
    def set_water(self, date: str, amount_ml: float) -> None: ...
    def upsert_body_targets(self, row: dict[str, Any]) -> None: ...
    def upsert_custom_food(self, row: dict[str, Any]) -> None: ...
    def upsert_weight(self, date: str, weight_kg: float) -> None: ...
    def update_weight(self, weight_id: str, date: str, weight_kg: float) -> bool: ...
    def delete_weight(self, weight_id: str) -> None: ...


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _run(query: Any, what: str) -> Any:
    """Execute a write, turning any driver error into StorageError."""
    try:
        return query.execute()
    except APIError as exc:
        if exc.code == "23505":
            raise
        log.error("%s failed: %s", what, exc)
        raise StorageError(what) from exc
    except Exception as exc:  # network, JSON, auth
        log.error("%s failed: %s", what, exc)
        raise StorageError(what) from exc


def _entry_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "section": row["section"],
        "food_name": row["food_name"],
        "qty": safe_num(row.get("qty")),
        "qty_label": row["qty_label"],
        "unit": row["unit"],
        "carbs": safe_num(row.get("carbs")),
        "protein": safe_num(row.get("protein")),
        "fat": safe_num(row.get("fat")),
        "calories": safe_num(row.get("calories")),
    }


def group_by_section(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {s: [] for s in SECTION_KEYS}
    for row in rows:
        if row["section"] in out:
            out[row["section"]].append(_entry_row(row))
    return out


class SupabaseRepository:
    def __init__(self, client: Any, user_id: str) -> None:
        self._db = client
        self._uid = user_id

    def _table(self, name: str):
        return self._db.table(name)

    def entries_for_date(self, date: str) -> dict[str, list[dict[str, Any]]]:
        res = (
            self._table("daily_entries")
            .select(ENTRY_COLUMNS)
            .eq("user_id", self._uid)
            .eq("entry_date", date)
            .order("created_at")
            .execute()
        )
        return group_by_section(res.data or [])

    def custom_foods(self) -> list[dict[str, Any]]:
        res = (
            self._table("custom_foods")
            .select("id, name, carbs, protein, fat, calories, piece_weight, density")
            .eq("user_id", self._uid)
            .execute()
        )
        return res.data or []

    def body_targets(self) -> dict[str, Any] | None:
        res = (
            self._table("body_targets")
            .select(
                "weight_kg, height_cm, age, sex, activity_level, goal, "
                "target_calories, target_protein, target_carbs, target_fat"
            )
            .eq("user_id", self._uid)
            .limit(1)
            .execute()
        )
        return (res.data or [None])[0]

    def water_intake_ml(self, date: str) -> float:
        res = (
            self._table("water_intake")
            .select("amount_ml")
            .eq("user_id", self._uid)
            .eq("entry_date", date)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        return safe_num(rows[0]["amount_ml"]) if rows else 0.0

    def logged_dates(self, limit: int) -> list[str]:
        res = (
            self._table("daily_entries")
            .select("entry_date")
            .eq("user_id", self._uid)
            .order("entry_date", desc=True)
            .limit(limit)
            .execute()
        )
        return [r["entry_date"] for r in (res.data or [])]

    def quickadd_rows(self, limit: int) -> list[dict[str, Any]]:
        res = (
            self._table("daily_entries")
            .select("section, food_name, qty, qty_label, unit, carbs, protein, fat, calories, created_at")
            .eq("user_id", self._uid)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []

    def daily_rows(self, start: str, end: str) -> list[dict[str, Any]]:
        res = (
            self._table("daily_entries")
            .select("entry_date, calories, protein, carbs, fat")
            .eq("user_id", self._uid)
            .gte("entry_date", start)
            .lte("entry_date", end)
            .execute()
        )
        return res.data or []

    def month_rows(self, start: str, end: str) -> list[dict[str, Any]]:
        res = (
            self._table("daily_entries")
            .select("entry_date, calories")
            .eq("user_id", self._uid)
            .gte("entry_date", start)
            .lte("entry_date", end)
            .execute()
        )
        return res.data or []

    def weight_logs(self, start: str, end: str) -> list[dict[str, Any]]:
        res = (
            self._table("weight_logs")
            .select("id, logged_date, weight_kg")
            .eq("user_id", self._uid)
            .gte("logged_date", start)
            .lte("logged_date", end)
            .order("logged_date")
            .execute()
        )
        return [
            {"id": r["id"], "logged_date": r["logged_date"], "weight_kg": safe_num(r["weight_kg"])}
            for r in (res.data or [])
        ]

    def nearest_prior_logged_date(self, before: str, section: str | None) -> str | None:
        """The single most recent date strictly before `before` with at least
        one entry (optionally in one section): one indexed lookup, no scan."""
        query = (
            self._table("daily_entries")
            .select("entry_date")
            .eq("user_id", self._uid)
            .lt("entry_date", before)
            .order("entry_date", desc=True)
            .limit(1)
        )
        if section:
            query = query.eq("section", section)
        rows = query.execute().data or []
        return rows[0]["entry_date"] if rows else None

    def recent_logged_dates(self, before: str, limit: int) -> list[str]:
        """Distinct prior logged dates, newest first. Reads a bounded window of
        raw rows and de-duplicates here (PostgREST has no SELECT DISTINCT)."""
        res = (
            self._table("daily_entries")
            .select("entry_date")
            .eq("user_id", self._uid)
            .lt("entry_date", before)
            .order("entry_date", desc=True)
            .limit(200)
            .execute()
        )
        seen: set[str] = set()
        out: list[str] = []
        for row in res.data or []:
            d = row["entry_date"]
            if d in seen:
                continue
            seen.add(d)
            out.append(d)
            if len(out) >= limit:
                break
        return out

    # ---- writes -----------------------------------------------------------

    def insert_entry(self, row: dict[str, Any]) -> str:
        res = _run(
            self._table("daily_entries").insert({**row, "user_id": self._uid}),
            "Failed to add item",
        )
        return res.data[0]["id"]

    def insert_entries(self, rows: list[dict[str, Any]]) -> int:
        if not rows:
            return 0
        stamped = [{**r, "user_id": self._uid} for r in rows]
        _run(self._table("daily_entries").insert(stamped), "Failed to copy")
        return len(stamped)

    def delete_entry(self, entry_id: str) -> None:
        _run(
            self._table("daily_entries").delete().eq("id", entry_id).eq("user_id", self._uid),
            "Failed to remove item",
        )

    def delete_day(self, date: str) -> None:
        _run(
            self._table("daily_entries").delete().eq("user_id", self._uid).eq("entry_date", date),
            "Failed to clear day",
        )

    def set_water(self, date: str, amount_ml: float) -> None:
        _run(
            self._table("water_intake").upsert(
                {"user_id": self._uid, "entry_date": date, "amount_ml": amount_ml, "updated_at": _now_iso()},
                on_conflict="user_id,entry_date",
            ),
            "Failed to update water intake",
        )

    def upsert_body_targets(self, row: dict[str, Any]) -> None:
        _run(
            self._table("body_targets").upsert({**row, "user_id": self._uid, "updated_at": _now_iso()}),
            "Failed to save targets",
        )

    def upsert_custom_food(self, row: dict[str, Any]) -> None:
        _run(
            self._table("custom_foods").upsert({**row, "user_id": self._uid}, on_conflict="user_id,name"),
            "Failed to save food",
        )

    def upsert_weight(self, date: str, weight_kg: float) -> None:
        _run(
            self._table("weight_logs").upsert(
                {"user_id": self._uid, "logged_date": date, "weight_kg": weight_kg, "updated_at": _now_iso()},
                on_conflict="user_id,logged_date",
            ),
            "Failed to save weight",
        )

    def update_weight(self, weight_id: str, date: str, weight_kg: float) -> bool:
        """Correct one row by id. A date collision raises DuplicateWeightDate
        (the unique index refuses it) rather than overwriting the other row."""
        query = (
            self._table("weight_logs")
            .update({"logged_date": date, "weight_kg": weight_kg, "updated_at": _now_iso()})
            .eq("id", weight_id)
            .eq("user_id", self._uid)
        )
        try:
            res = _run(query, "Failed to update weight")
        except APIError as exc:
            raise DuplicateWeightDate() from exc
        return bool(res.data)

    def delete_weight(self, weight_id: str) -> None:
        _run(
            self._table("weight_logs").delete().eq("id", weight_id).eq("user_id", self._uid),
            "Failed to delete weight",
        )
