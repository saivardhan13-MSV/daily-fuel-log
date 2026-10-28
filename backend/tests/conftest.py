from __future__ import annotations

import uuid
from datetime import date
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.auth import AuthedUser, get_current_user
from app.config import get_settings
from app.deps import get_repo, get_today
from app.errors import DuplicateWeightDate
from app.main import app
from app.repo import group_by_section
from app.sections import SECTION_KEYS

USER = AuthedUser(user_id="user-1", token="test-token")
TODAY = date(2026, 9, 13)


def entry(id_: str, date_: str, section: str, name: str, cal: float, protein: float = 0, **kw: Any) -> dict[str, Any]:
    return {
        "id": id_,
        "entry_date": date_,
        "section": section,
        "food_name": name,
        "qty": 100,
        "qty_label": "100g",
        "unit": "g",
        "carbs": kw.get("carbs", 0),
        "protein": protein,
        "fat": kw.get("fat", 0),
        "calories": cal,
        "created_at": kw.get("created_at", f"{date_}T08:00:00Z"),
    }


class FakeRepo:
    """In-memory stand-in for SupabaseRepository (same Repository protocol)."""

    def __init__(self, entries=None, weights=None, targets=None, water=None, foods=None) -> None:
        self.entries: list[dict[str, Any]] = entries or []
        self.weights: list[dict[str, Any]] = weights or []
        self.targets = targets
        self.water = water or {}
        self.foods = foods or []

    def entries_for_date(self, date_):
        return group_by_section([e for e in self.entries if e["entry_date"] == date_])

    def custom_foods(self):
        return self.foods

    def body_targets(self):
        return self.targets

    def water_intake_ml(self, date_):
        return float(self.water.get(date_, 0))

    def logged_dates(self, limit):
        return [e["entry_date"] for e in sorted(self.entries, key=lambda e: e["entry_date"], reverse=True)][:limit]

    def quickadd_rows(self, limit):
        return sorted(self.entries, key=lambda e: e["created_at"], reverse=True)[:limit]

    def daily_rows(self, start, end):
        return [e for e in self.entries if start <= e["entry_date"] <= end]

    def month_rows(self, start, end):
        return self.daily_rows(start, end)

    def weight_logs(self, start, end):
        return sorted(
            (w for w in self.weights if start <= w["logged_date"] <= end), key=lambda w: w["logged_date"]
        )

    def nearest_prior_logged_date(self, before, section):
        dates = [
            e["entry_date"]
            for e in self.entries
            if e["entry_date"] < before and (section is None or e["section"] == section)
        ]
        return max(dates) if dates else None

    def recent_logged_dates(self, before, limit):
        return sorted({e["entry_date"] for e in self.entries if e["entry_date"] < before}, reverse=True)[:limit]

    # ---- writes (same contract as SupabaseRepository) ----

    def insert_entry(self, row):
        new_id = str(uuid.uuid4())
        self.entries.append({**row, "id": new_id, "created_at": f"{row['entry_date']}T12:00:00Z"})
        return new_id

    def insert_entries(self, rows):
        for row in rows:
            self.insert_entry(row)
        return len(rows)

    def delete_entry(self, entry_id):
        self.entries = [e for e in self.entries if e["id"] != entry_id]

    def delete_day(self, date_):
        self.entries = [e for e in self.entries if e["entry_date"] != date_]

    def set_water(self, date_, amount_ml):
        self.water[date_] = amount_ml

    def upsert_body_targets(self, row):
        self.targets = row

    def upsert_custom_food(self, row):
        self.foods = [f for f in self.foods if f["name"] != row["name"]] + [{**row, "id": str(uuid.uuid4())}]

    def upsert_weight(self, date_, weight_kg):
        for w in self.weights:
            if w["logged_date"] == date_:
                w["weight_kg"] = weight_kg
                return
        self.weights.append({"id": str(uuid.uuid4()), "logged_date": date_, "weight_kg": weight_kg})

    def update_weight(self, weight_id, date_, weight_kg):
        target = next((w for w in self.weights if w["id"] == weight_id), None)
        if target is None:
            return False
        if any(w["logged_date"] == date_ and w["id"] != weight_id for w in self.weights):
            raise DuplicateWeightDate()
        target["logged_date"], target["weight_kg"] = date_, weight_kg
        return True

    def delete_weight(self, weight_id):
        self.weights = [w for w in self.weights if w["id"] != weight_id]


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "http://localhost:54321")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def make_client():
    """Build a TestClient with the given FakeRepo, authenticated as USER."""

    def _make(repo: FakeRepo, authed: bool = True) -> TestClient:
        app.dependency_overrides.clear()
        app.dependency_overrides[get_repo] = lambda: repo
        app.dependency_overrides[get_today] = lambda: TODAY
        if authed:
            app.dependency_overrides[get_current_user] = lambda: USER
        return TestClient(app)

    yield _make
    app.dependency_overrides.clear()


__all__ = ["FakeRepo", "entry", "SECTION_KEYS", "TODAY", "USER"]
