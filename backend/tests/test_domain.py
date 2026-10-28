import math
from datetime import date, datetime, timezone

import pytest

from app.domain.nutrition import round1, safe_num, totals_for_entries, totals_for_items
from app.domain.quickadd import rank_suggestions
from app.domain.streak import compute_streak
from app.domain.trends import build_daily_totals
from app.domain.weight import is_valid_weight


class TestNutrition:
    def test_safe_num_handles_strings_and_garbage(self):
        assert safe_num("77.6") == 77.6
        assert safe_num(None) == 0
        assert safe_num("abc") == 0
        assert safe_num(math.nan) == 0
        assert safe_num(math.inf) == 0

    def test_round1(self):
        assert round1(114.34) == 114.3
        assert round1("2.0") == 2.0

    def test_totals(self):
        items = [
            {"calories": 430, "protein": 35, "carbs": 55, "fat": 8},
            {"calories": "97", "protein": "0.7", "carbs": 22.7, "fat": 0.3},
        ]
        t = totals_for_items(items)
        assert (t.cal, round1(t.protein)) == (527, 35.7)
        assert totals_for_entries({"breakfast": items, "lunch": items}).cal == 1054


class TestWeightValidation:
    @pytest.mark.parametrize("w", [0.1, 78.4, 499.9, 1, 250])
    def test_accepts(self, w):
        assert is_valid_weight(w)

    @pytest.mark.parametrize(
        "w", [0, -5, 500, 501, math.nan, math.inf, -math.inf, "78", None, True]
    )
    def test_rejects(self, w):
        assert not is_valid_weight(w)


class TestStreak:
    TODAY = date(2026, 9, 13)

    def test_no_entries(self):
        assert compute_streak([], self.TODAY) == 0

    def test_counts_back_from_today(self):
        assert compute_streak(["2026-09-13", "2026-09-12", "2026-09-11"], self.TODAY) == 3

    def test_empty_today_does_not_break_streak(self):
        assert compute_streak(["2026-09-12", "2026-09-11"], self.TODAY) == 2

    def test_gap_ends_streak(self):
        assert compute_streak(["2026-09-13", "2026-09-11"], self.TODAY) == 1

    def test_stale_history_is_zero(self):
        assert compute_streak(["2026-09-01"], self.TODAY) == 0

    def test_month_boundary(self):
        assert compute_streak(["2026-10-02", "2026-10-01", "2026-09-30"], date(2026, 10, 2)) == 3


class TestDailyTotals:
    def test_zero_fills_but_marks_unlogged(self):
        rows = [
            {"entry_date": "2026-09-10", "calories": 430, "protein": 35, "carbs": 55, "fat": 8},
            {"entry_date": "2026-09-10", "calories": 590, "protein": 45, "carbs": 70, "fat": 12},
        ]
        days = build_daily_totals(rows, "2026-09-09", "2026-09-11")
        assert [d["date"] for d in days] == ["2026-09-09", "2026-09-10", "2026-09-11"]
        assert [d["logged"] for d in days] == [False, True, False]
        assert days[1]["cal"] == 1020 and days[1]["protein"] == 80
        assert days[0]["cal"] == 0

    def test_zero_calorie_entry_still_counts_as_logged(self):
        rows = [{"entry_date": "2026-09-10", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}]
        (day,) = build_daily_totals(rows, "2026-09-10", "2026-09-10")
        assert day["logged"] is True and day["cal"] == 0

    def test_string_numerics_are_normalised(self):
        rows = [{"entry_date": "2026-09-10", "calories": "430.5", "protein": "35", "carbs": "1", "fat": "2"}]
        (day,) = build_daily_totals(rows, "2026-09-10", "2026-09-10")
        assert day["cal"] == 430.5


def _row(section, name, created, **kw):
    return {
        "section": section,
        "food_name": name,
        "qty": 100,
        "qty_label": "100g",
        "unit": "g",
        "carbs": 1,
        "protein": 2,
        "fat": 3,
        "calories": 4,
        "created_at": created,
        **kw,
    }


class TestQuickAdd:
    NOW = datetime(2026, 9, 13, 12, 0, tzinfo=timezone.utc)

    def test_every_section_present_even_when_empty(self):
        out = rank_suggestions([], self.NOW)
        assert set(out) == {
            "breakfast", "midMorningSnack", "lunch", "eveningSnack",
            "preWorkout", "postWorkout", "dinner",
        }
        assert all(v == [] for v in out.values())

    def test_frequent_beats_single_recent_when_similar_age(self):
        rows = [  # newest first
            _row("breakfast", "Banana", "2026-09-12T08:00:00Z"),
            _row("breakfast", "Oats", "2026-09-12T07:00:00Z"),
            _row("breakfast", "oats", "2026-09-11T07:00:00Z"),  # same food, case-insensitive
            _row("breakfast", "Oats", "2026-09-10T07:00:00Z"),
        ]
        names = [s["foodName"] for s in rank_suggestions(rows, self.NOW)["breakfast"]]
        assert names == ["Oats", "Banana"]

    def test_stale_food_decays_below_fresh_one(self):
        rows = [
            _row("lunch", "Fresh", "2026-09-13T08:00:00Z"),
            _row("lunch", "Old", "2026-05-01T08:00:00Z"),
            _row("lunch", "Old", "2026-05-01T07:00:00Z"),
        ]
        names = [s["foodName"] for s in rank_suggestions(rows, self.NOW)["lunch"]]
        assert names[0] == "Fresh"

    def test_latest_row_supplies_the_serving(self):
        rows = [
            _row("dinner", "Rice", "2026-09-12T20:00:00Z", qty=250, qty_label="250g"),
            _row("dinner", "Rice", "2026-09-10T20:00:00Z", qty=100, qty_label="100g"),
        ]
        (s,) = rank_suggestions(rows, self.NOW)["dinner"]
        assert (s["qty"], s["qtyLabel"]) == (250, "250g")

    def test_capped_at_four_per_section(self):
        rows = [_row("lunch", f"Food{i}", f"2026-09-1{i % 3}T08:00:00Z") for i in range(9)]
        assert len(rank_suggestions(rows, self.NOW)["lunch"]) == 4

    def test_same_food_in_different_sections_is_separate(self):
        rows = [
            _row("breakfast", "Milk", "2026-09-12T08:00:00Z"),
            _row("dinner", "Milk", "2026-09-12T20:00:00Z"),
        ]
        out = rank_suggestions(rows, self.NOW)
        assert len(out["breakfast"]) == 1 and len(out["dinner"]) == 1
