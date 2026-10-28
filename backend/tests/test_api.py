from __future__ import annotations

import httpx
import pytest
from fastapi.testclient import TestClient

from app import auth
from app.main import app
from tests.conftest import FakeRepo, entry


@pytest.fixture
def populated():
    return FakeRepo(
        entries=[
            entry("a", "2026-09-10", "breakfast", "Oats + whey", 430, 35, carbs=55, fat=8),
            entry("b", "2026-09-10", "breakfast", "Banana", 97, 0.7, carbs=22.7, fat=0.3),
            entry("c", "2026-09-10", "lunch", "Chicken rice bowl", 590, 45, carbs=70, fat=12),
            entry("d", "2026-09-12", "breakfast", "Oats + whey", 430, 35, carbs=55, fat=8),
            entry("e", "2026-09-13", "lunch", "Salad", 200, 10),
        ],
        weights=[
            {"id": "w1", "logged_date": "2026-09-08", "weight_kg": 78.2},
            {"id": "w2", "logged_date": "2026-09-12", "weight_kg": 77.6},
            {"id": "w3", "logged_date": "2026-07-01", "weight_kg": 80.0},  # outside any window
        ],
        targets={"target_calories": 2400, "target_protein": 180, "weight_kg": 78},
        water={"2026-09-13": 750},
    )


class TestAuth:
    def test_missing_token_is_401(self):
        app.dependency_overrides.clear()
        client = TestClient(app)
        res = client.get("/api/day", params={"date": "2026-09-13"})
        assert res.status_code == 401

    def test_invalid_token_is_401(self, monkeypatch):
        class BoomClient:
            class auth:
                @staticmethod
                def get_user(_token):
                    raise RuntimeError("invalid JWT")

        monkeypatch.setattr(auth, "create_client", lambda *a, **k: BoomClient)
        app.dependency_overrides.clear()
        res = TestClient(app).get("/api/me", headers={"Authorization": "Bearer nope"})
        assert res.status_code == 401

    def test_user_id_comes_from_the_verified_token(self, monkeypatch):
        class Resp:
            user = type("U", (), {"id": "verified-user-id"})()

        class OkClient:
            class auth:
                @staticmethod
                def get_user(token):
                    assert token == "good-token"
                    return Resp()

        monkeypatch.setattr(auth, "create_client", lambda *a, **k: OkClient)
        app.dependency_overrides.clear()
        res = TestClient(app).get("/api/me", headers={"Authorization": "Bearer good-token"})
        assert res.status_code == 200
        assert res.json() == {"user_id": "verified-user-id"}

    def test_no_endpoint_accepts_a_user_id_param(self):
        """user_id is never client-supplied: not as a query param, path
        param or body field on any route."""
        for route in app.routes:
            params = {p.name for p in getattr(route, "dependant", None).query_params} if hasattr(route, "dependant") else set()
            assert "user_id" not in params, route.path


def test_health_is_public(make_client):
    assert make_client(FakeRepo(), authed=False).get("/api/health").json() == {"status": "ok"}


class TestDay:
    def test_groups_by_section_with_all_sections_present(self, make_client, populated):
        body = make_client(populated).get("/api/day", params={"date": "2026-09-10"}).json()
        assert set(body) == {
            "breakfast", "midMorningSnack", "lunch", "eveningSnack",
            "preWorkout", "postWorkout", "dinner",
        }
        assert [i["food_name"] for i in body["breakfast"]] == ["Oats + whey", "Banana"]
        assert body["dinner"] == []

    @pytest.mark.parametrize("bad", ["2026-02-30", "2026-13-40", "abc", "", "2026-9-1"])
    def test_rejects_impossible_dates(self, make_client, populated, bad):
        assert make_client(populated).get("/api/day", params={"date": bad}).status_code == 422

    def test_date_required(self, make_client, populated):
        assert make_client(populated).get("/api/day").status_code == 422


class TestTrends:
    def test_30_day_window_zero_fills_and_flags_logged(self, make_client, populated):
        body = make_client(populated).get("/api/trends", params={"days": 30}).json()
        assert body["range"] == {"start": "2026-08-15", "end": "2026-09-13"}
        assert len(body["days"]) == 30
        by_date = {d["date"]: d for d in body["days"]}
        assert by_date["2026-09-10"]["logged"] is True
        assert by_date["2026-09-10"]["cal"] == 430 + 97 + 590
        assert by_date["2026-09-11"]["logged"] is False and by_date["2026-09-11"]["cal"] == 0

    def test_7_day_window(self, make_client, populated):
        body = make_client(populated).get("/api/trends", params={"days": 7}).json()
        assert body["range"] == {"start": "2026-09-07", "end": "2026-09-13"}
        assert len(body["days"]) == 7

    @pytest.mark.parametrize("days", [0, -1, 91, 100000])
    def test_days_bounded(self, make_client, populated, days):
        assert make_client(populated).get("/api/trends", params={"days": days}).status_code == 422


class TestWeightLogs:
    def test_only_real_rows_in_the_same_window_as_trends(self, make_client, populated):
        body = make_client(populated).get("/api/weight-logs", params={"days": 30}).json()
        assert body["range"] == {"start": "2026-08-15", "end": "2026-09-13"}
        assert [(w["logged_date"], w["weight_kg"]) for w in body["logs"]] == [
            ("2026-09-08", 78.2),
            ("2026-09-12", 77.6),
        ]  # no zero-filled days; the July entry is outside the window

    def test_empty(self, make_client):
        assert make_client(FakeRepo()).get("/api/weight-logs").json()["logs"] == []


class TestStreakWaterTargets:
    def test_streak_counts_back_from_today(self, make_client, populated):
        # 09-13 and 09-12 logged, 09-11 missing -> streak of 2
        assert make_client(populated).get("/api/streak").json() == {"streak": 2}

    def test_water(self, make_client, populated):
        assert make_client(populated).get("/api/water", params={"date": "2026-09-13"}).json() == {"amount_ml": 750}
        assert make_client(populated).get("/api/water", params={"date": "2026-09-01"}).json() == {"amount_ml": 0}

    def test_body_targets_null_when_unset(self, make_client):
        assert make_client(FakeRepo()).get("/api/body-targets").json() is None

    def test_body_targets(self, make_client, populated):
        body = make_client(populated).get("/api/body-targets").json()
        assert body["target_calories"] == 2400 and body["weight_kg"] == 78


class TestCopyPreviews:
    def test_meal_preview_finds_nearest_prior_date_with_that_section(self, make_client, populated):
        body = make_client(populated).get(
            "/api/copy/meal-preview", params={"dest_date": "2026-09-13", "section": "breakfast"}
        ).json()
        assert body["sourceDate"] == "2026-09-12"
        assert [i["food_name"] for i in body["items"]] == ["Oats + whey"]

    def test_meal_preview_skips_dates_without_that_section(self, make_client, populated):
        body = make_client(populated).get(
            "/api/copy/meal-preview", params={"dest_date": "2026-09-13", "section": "lunch"}
        ).json()
        assert body["sourceDate"] == "2026-09-10"

    def test_meal_preview_empty_state_is_null_not_an_error(self, make_client, populated):
        res = make_client(populated).get(
            "/api/copy/meal-preview", params={"dest_date": "2026-09-13", "section": "dinner"}
        )
        assert res.status_code == 200 and res.json() is None

    def test_meal_preview_source_is_strictly_before_destination(self, make_client, populated):
        body = make_client(populated).get(
            "/api/copy/meal-preview", params={"dest_date": "2026-09-12", "section": "breakfast"}
        ).json()
        assert body["sourceDate"] == "2026-09-10"

    def test_meal_preview_rejects_unknown_section(self, make_client, populated):
        res = make_client(populated).get(
            "/api/copy/meal-preview", params={"dest_date": "2026-09-13", "section": "brunch"}
        )
        assert res.status_code == 422

    def test_day_preview_defaults_to_nearest_prior_day(self, make_client, populated):
        body = make_client(populated).get("/api/copy/day-preview", params={"dest_date": "2026-09-13"}).json()
        assert body["sourceDate"] == "2026-09-12"

    def test_day_preview_explicit_source(self, make_client, populated):
        body = make_client(populated).get(
            "/api/copy/day-preview", params={"dest_date": "2026-09-13", "source_date": "2026-09-10"}
        ).json()
        assert body["sourceDate"] == "2026-09-10"
        assert len(body["entries"]["breakfast"]) == 2

    @pytest.mark.parametrize("source", ["2026-09-13", "2026-09-14", "2027-01-01"])
    def test_day_preview_rejects_same_day_or_future_source(self, make_client, populated, source):
        res = make_client(populated).get(
            "/api/copy/day-preview", params={"dest_date": "2026-09-13", "source_date": source}
        )
        assert res.status_code == 422

    def test_day_preview_rejects_impossible_source(self, make_client, populated):
        res = make_client(populated).get(
            "/api/copy/day-preview", params={"dest_date": "2026-09-13", "source_date": "2026-02-30"}
        )
        assert res.status_code == 422

    def test_recent_dates_are_distinct_newest_first_and_before_dest(self, make_client, populated):
        body = make_client(populated).get("/api/copy/recent-dates", params={"dest_date": "2026-09-13"}).json()
        assert body == ["2026-09-12", "2026-09-10"]


class TestMonthTotals:
    def test_sums_per_day(self, make_client, populated):
        body = make_client(populated).get("/api/month-totals", params={"year": 2026, "month": 8}).json()
        assert body["2026-09-10"] == 430 + 97 + 590
        assert body["2026-09-13"] == 200

    def test_month_is_zero_indexed(self, make_client, populated):
        assert make_client(populated).get("/api/month-totals", params={"year": 2026, "month": 12}).status_code == 422


class TestQuickAdd:
    def test_ranked_suggestions_per_section(self, make_client, populated):
        body = make_client(populated).get("/api/quick-add").json()
        assert body["breakfast"][0]["foodName"] == "Oats + whey"
        assert body["dinner"] == []
        assert set(body["breakfast"][0]) == {"foodName", "qty", "qtyLabel", "unit", "carbs", "protein", "fat", "calories"}


class TestFoodSearch:
    def test_short_query_returns_empty_without_calling_usda(self, make_client, monkeypatch):
        monkeypatch.setattr("app.routers.read.search_usda", lambda *a, **k: pytest.fail("should not be called"))
        assert make_client(FakeRepo()).get("/api/food-search", params={"q": "ab"}).json() == []

    def test_requires_auth(self):
        app.dependency_overrides.clear()
        assert TestClient(app).get("/api/food-search", params={"q": "chicken"}).status_code == 401


class TestUsdaParsing:
    def test_parses_and_skips_incomplete_rows(self):
        from app.food_search import parse_usda_foods

        payload = {
            "foods": [
                {
                    "description": "  Chicken breast, raw  ",
                    "brandOwner": "ACME FOODS INC AND SOME VERY LONG PARENT COMPANY NAME",
                    "foodNutrients": [
                        {"nutrientNumber": "208", "unitName": "KCAL", "value": 120},
                        {"nutrientNumber": "208", "unitName": "KJ", "value": 502},
                        {"nutrientNumber": "203", "value": 22.5},
                        {"nutrientNumber": "204", "value": 2.6},
                        {"nutrientNumber": "205", "value": 0},
                    ],
                },
                {  # missing fat -> skipped, never guessed
                    "description": "Mystery",
                    "foodNutrients": [
                        {"nutrientNumber": "208", "unitName": "KCAL", "value": 1},
                        {"nutrientNumber": "203", "value": 1},
                        {"nutrientNumber": "205", "value": 1},
                    ],
                },
            ]
        }
        (food,) = parse_usda_foods(payload)
        assert food["name"] == "Chicken breast, raw"
        assert food["cal"] == 120  # the kcal row, not the kJ one
        assert food["source"] == "ACME FOODS INC AND SOME VERY L"  # truncated to 30
        assert (food["protein"], food["fat"], food["carbs"]) == (22.5, 2.6, 0.0)

    def test_search_fails_soft(self):
        from app.food_search import search_usda

        assert search_usda("chicken", None) == []

        boom = httpx.Client(transport=httpx.MockTransport(lambda r: (_ for _ in ()).throw(httpx.ConnectError("down"))))
        assert search_usda("chicken", "key", client=boom) == []

        not_ok = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(500)))
        assert search_usda("chicken", "key", client=not_ok) == []

        ok = httpx.Client(
            transport=httpx.MockTransport(
                lambda r: httpx.Response(
                    200,
                    json={
                        "foods": [
                            {
                                "description": "Egg",
                                "foodNutrients": [
                                    {"nutrientNumber": "208", "unitName": "KCAL", "value": 143},
                                    {"nutrientNumber": "203", "value": 12.6},
                                    {"nutrientNumber": "204", "value": 9.5},
                                    {"nutrientNumber": "205", "value": 0.7},
                                ],
                            }
                        ]
                    },
                )
            )
        )
        (food,) = search_usda("egg", "key", client=ok)
        assert food["name"] == "Egg" and food["source"] == "USDA"
