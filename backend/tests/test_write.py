from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import FakeRepo, entry

UUID = "11111111-2222-4333-8444-555555555555"

ENTRY_BODY = {
    "date": "2026-09-13",
    "section": "lunch",
    "foodName": "Rice",
    "qty": 150,
    "qtyLabel": "150g",
    "unit": "g",
    "carbs": 40,
    "protein": 4,
    "fat": 1,
    "calories": 190,
}


def client_for(make_client, repo=None):
    repo = repo if repo is not None else FakeRepo()
    return make_client(repo), repo


# ---- auth + identity -------------------------------------------------------


def test_every_write_requires_a_token(make_client):
    make_client(FakeRepo(), authed=False)
    app.dependency_overrides.clear()  # run the real get_repo -> get_current_user chain
    c = TestClient(app)
    calls = [
        c.post("/api/entries", json=ENTRY_BODY),
        c.delete(f"/api/entries/{UUID}"),
        c.delete("/api/day", params={"date": "2026-09-13"}),
        c.post("/api/copy", json={"destDate": "2026-09-13", "sourceDate": "2026-09-12"}),
        c.put("/api/custom-foods", json={"name": "x", "carbs": 1, "protein": 1, "fat": 1, "calories": 1}),
        c.post("/api/water/add", json={"date": "2026-09-13", "deltaMl": 250}),
        c.post("/api/water/reset", json={"date": "2026-09-13"}),
        c.put("/api/weight-logs", json={"loggedDate": "2026-09-13", "weightKg": 70}),
        c.patch(f"/api/weight-logs/{UUID}", json={"loggedDate": "2026-09-13", "weightKg": 70}),
        c.delete(f"/api/weight-logs/{UUID}"),
    ]
    assert [r.status_code for r in calls] == [401] * len(calls)


@pytest.mark.parametrize(
    "method,path,body",
    [
        ("post", "/api/entries", ENTRY_BODY),
        ("put", "/api/weight-logs", {"loggedDate": "2026-09-13", "weightKg": 70}),
        ("post", "/api/water/add", {"date": "2026-09-13", "deltaMl": 250}),
        ("post", "/api/copy", {"destDate": "2026-09-13", "sourceDate": "2026-09-12"}),
    ],
)
def test_a_body_cannot_name_a_user(make_client, method, path, body):
    c, repo = client_for(make_client)
    r = getattr(c, method)(path, json={**body, "user_id": "someone-else"})
    assert r.status_code == 422
    assert repo.entries == [] and repo.weights == [] and repo.water == {}


def test_no_write_schema_declares_user_id():
    schema = app.openapi()
    for path, ops in schema["paths"].items():
        for op in ops.values():
            assert "user_id" not in str(op.get("parameters", [])), path
    for name, comp in schema["components"]["schemas"].items():
        assert "user_id" not in comp.get("properties", {}), name


# ---- entries ---------------------------------------------------------------


def test_add_entry_stores_it_and_returns_its_id(make_client):
    c, repo = client_for(make_client)
    r = c.post("/api/entries", json=ENTRY_BODY)
    assert r.status_code == 201
    assert [e["id"] for e in repo.entries] == [r.json()["id"]]
    assert c.get("/api/day", params={"date": "2026-09-13"}).json()["lunch"][0]["food_name"] == "Rice"


@pytest.mark.parametrize(
    "patch",
    [
        {"date": "2026-02-30"},
        {"date": "13/09/2026"},
        {"section": "brunch"},
        {"unit": "oz"},
        {"foodName": "   "},
        {"foodName": "x" * 81},
        {"qty": -1},
        {"calories": -5},
        {"protein": float("nan")},
        {"fat": float("inf")},
        {"qtyLabel": ""},
    ],
)
def test_add_entry_rejects_bad_input(make_client, patch):
    c, repo = client_for(make_client)
    r = c.post("/api/entries", content=__import__("json").dumps({**ENTRY_BODY, **patch}),
               headers={"content-type": "application/json"})
    assert r.status_code == 422, r.text
    assert isinstance(r.json()["detail"], str)
    assert repo.entries == []


def test_add_entry_allows_zero_quantity_like_the_ui_can_send(make_client):
    c, repo = client_for(make_client)
    assert c.post("/api/entries", json={**ENTRY_BODY, "qty": 0}).status_code == 201


def test_remove_entry(make_client):
    repo = FakeRepo(entries=[entry(UUID, "2026-09-12", "lunch", "Rice", 190)])
    c, _ = client_for(make_client, repo)
    assert c.delete(f"/api/entries/{UUID}").json() == {"ok": True}
    assert repo.entries == []


def test_remove_entry_rejects_non_uuid_and_is_idempotent(make_client):
    c, _ = client_for(make_client)
    assert c.delete("/api/entries/not-a-uuid").status_code == 422
    assert c.delete(f"/api/entries/{UUID}").status_code == 200  # already gone


def test_clear_day_only_clears_that_date(make_client):
    repo = FakeRepo(entries=[entry("a", "2026-09-12", "lunch", "A", 1), entry("b", "2026-09-13", "lunch", "B", 1)])
    c, _ = client_for(make_client, repo)
    assert c.delete("/api/day", params={"date": "2026-09-13"}).status_code == 200
    assert [e["id"] for e in repo.entries] == ["a"]
    assert c.delete("/api/day", params={"date": "2026-02-30"}).status_code == 422


# ---- copy ------------------------------------------------------------------


def _source_repo():
    return FakeRepo(
        entries=[
            entry("a", "2026-09-10", "breakfast", "Oats", 300, 10),
            entry("b", "2026-09-10", "lunch", "Chicken", 500, 40),
            entry("c", "2026-09-10", "lunch", "Rice", 200, 4),
        ]
    )


def test_copy_meal_copies_only_that_section_to_the_destination(make_client):
    c, repo = client_for(make_client, _source_repo())
    r = c.post("/api/copy", json={"destDate": "2026-09-12", "sourceDate": "2026-09-10", "section": "lunch"})
    assert r.json() == {"copiedCount": 2}
    copied = [e for e in repo.entries if e["entry_date"] == "2026-09-12"]
    assert sorted(e["food_name"] for e in copied) == ["Chicken", "Rice"]
    assert {e["section"] for e in copied} == {"lunch"}
    assert len([e for e in repo.entries if e["entry_date"] == "2026-09-10"]) == 3  # source untouched


def test_copy_day_keeps_each_row_in_its_original_section(make_client):
    c, repo = client_for(make_client, _source_repo())
    r = c.post("/api/copy", json={"destDate": "2026-09-12", "sourceDate": "2026-09-10"})
    assert r.json() == {"copiedCount": 3}
    sections = {e["food_name"]: e["section"] for e in repo.entries if e["entry_date"] == "2026-09-12"}
    assert sections == {"Oats": "breakfast", "Chicken": "lunch", "Rice": "lunch"}


@pytest.mark.parametrize("source", ["2026-09-12", "2026-09-13"])
def test_copy_rejects_source_on_or_after_destination(make_client, source):
    c, repo = client_for(make_client, _source_repo())
    r = c.post("/api/copy", json={"destDate": "2026-09-12", "sourceDate": source})
    assert r.status_code == 422
    assert len(repo.entries) == 3


def test_copy_rejects_empty_source_and_bad_inputs(make_client):
    c, repo = client_for(make_client, _source_repo())
    assert c.post("/api/copy", json={"destDate": "2026-09-12", "sourceDate": "2026-09-05"}).status_code == 422
    assert c.post("/api/copy", json={"destDate": "2026-09-12", "sourceDate": "2026-09-10", "section": "brunch"}).status_code == 422
    assert c.post("/api/copy", json={"destDate": "2026-02-30", "sourceDate": "2026-09-10"}).status_code == 422
    assert len(repo.entries) == 3


# ---- custom foods ----------------------------------------------------------


def test_custom_food_is_lowercased_trimmed_and_upserted(make_client):
    c, repo = client_for(make_client)
    body = {"name": "  Protein Bar ", "carbs": 20, "protein": 20, "fat": 8, "calories": 250, "pieceWeight": 60}
    assert c.put("/api/custom-foods", json=body).status_code == 200
    assert c.put("/api/custom-foods", json={**body, "calories": 260}).status_code == 200
    assert [(f["name"], f["calories"]) for f in repo.foods] == [("protein bar", 260)]
    assert repo.foods[0]["piece_weight"] == 60 and repo.foods[0]["density"] is None


@pytest.mark.parametrize(
    "patch",
    [{"name": " "}, {"name": "x" * 81}, {"calories": -1}, {"pieceWeight": 0}, {"density": -2}],
)
def test_custom_food_rejects_bad_input(make_client, patch):
    c, repo = client_for(make_client)
    body = {"name": "Bar", "carbs": 1, "protein": 1, "fat": 1, "calories": 10, **patch}
    assert c.put("/api/custom-foods", json=body).status_code == 422
    assert repo.foods == []


# ---- water -----------------------------------------------------------------


def test_water_adds_accumulates_and_never_goes_negative(make_client):
    c, repo = client_for(make_client)
    assert c.post("/api/water/add", json={"date": "2026-09-13", "deltaMl": 250}).json() == {"amount_ml": 250}
    assert c.post("/api/water/add", json={"date": "2026-09-13", "deltaMl": 250}).json() == {"amount_ml": 500}
    assert c.post("/api/water/add", json={"date": "2026-09-13", "deltaMl": -900}).json() == {"amount_ml": 0}
    assert repo.water["2026-09-13"] == 0


def test_water_reset_and_validation(make_client):
    repo = FakeRepo(water={"2026-09-13": 750})
    c, _ = client_for(make_client, repo)
    assert c.post("/api/water/reset", json={"date": "2026-09-13"}).status_code == 200
    assert repo.water["2026-09-13"] == 0
    assert c.post("/api/water/add", json={"date": "2026-02-30", "deltaMl": 250}).status_code == 422
    assert c.post("/api/water/add", json={"date": "2026-09-13", "deltaMl": 10_001}).status_code == 422
    assert c.post("/api/water/add", content='{"date":"2026-09-13","deltaMl":NaN}',
                  headers={"content-type": "application/json"}).status_code == 422
    assert c.post("/api/water/reset", json={"date": "nope"}).status_code == 422


# ---- body targets ----------------------------------------------------------

TARGETS = {"weightKg": 78, "heightCm": 178, "age": 30, "sex": "male", "activityLevel": "moderate", "goal": "maintain"}


def test_targets_are_computed_server_side_and_stored(make_client):
    c, repo = client_for(make_client)
    r = c.put("/api/body-targets", json=TARGETS)
    assert r.json() == {"calories": 2709, "protein": 140, "carbs": 368, "fat": 75}
    assert repo.targets["target_calories"] == 2709 and repo.targets["activity_level"] == "moderate"
    assert "target_calories" not in TARGETS  # client cannot dictate the numbers


def test_targets_reject_client_supplied_macros_and_bad_ranges(make_client):
    c, repo = client_for(make_client)
    assert c.put("/api/body-targets", json={**TARGETS, "target_calories": 9999}).status_code == 422
    for patch in ({"weightKg": 0}, {"weightKg": 500}, {"heightCm": 10}, {"age": 0}, {"age": 200},
                  {"sex": "x"}, {"goal": "shred"}, {"activityLevel": "extreme"}):
        assert c.put("/api/body-targets", json={**TARGETS, **patch}).status_code == 422, patch
    assert repo.targets is None


# ---- weight ----------------------------------------------------------------


def test_log_weight_upserts_by_date(make_client):
    c, repo = client_for(make_client)
    assert c.put("/api/weight-logs", json={"loggedDate": "2026-09-12", "weightKg": 78.4}).status_code == 200
    assert c.put("/api/weight-logs", json={"loggedDate": "2026-09-12", "weightKg": 78.0}).status_code == 200
    assert [(w["logged_date"], w["weight_kg"]) for w in repo.weights] == [("2026-09-12", 78.0)]


@pytest.mark.parametrize(
    "patch,message",
    [
        ({"loggedDate": "2026-02-30"}, "Invalid date"),
        ({"weightKg": 0}, "Enter a weight between 0 and 500 kg"),
        ({"weightKg": 500}, "Enter a weight between 0 and 500 kg"),
        ({"weightKg": -3}, "Enter a weight between 0 and 500 kg"),
        ({"loggedDate": "2026-09-15"}, "You can't log a future date"),
    ],
)
def test_log_weight_validation_messages_match_the_typescript(make_client, patch, message):
    c, repo = client_for(make_client)
    r = c.put("/api/weight-logs", json={"loggedDate": "2026-09-12", "weightKg": 70, **patch})
    assert r.status_code == 422 and r.json()["detail"] == message
    assert repo.weights == []


def test_log_weight_rejects_nan_and_infinity(make_client):
    c, repo = client_for(make_client)
    for raw in ("NaN", "Infinity", "-Infinity"):
        r = c.put("/api/weight-logs", content=f'{{"loggedDate":"2026-09-12","weightKg":{raw}}}',
                  headers={"content-type": "application/json"})
        assert r.status_code == 422, raw
    assert repo.weights == []


def test_future_check_trusts_client_today_only_within_one_day(make_client):
    c, repo = client_for(make_client)  # server today = 2026-09-13
    ahead = {"loggedDate": "2026-09-14", "weightKg": 70, "clientToday": "2026-09-14"}  # e.g. India, early morning
    assert c.put("/api/weight-logs", json=ahead).status_code == 200
    spoof = {"loggedDate": "2026-12-25", "weightKg": 70, "clientToday": "2026-12-25"}
    assert c.put("/api/weight-logs", json=spoof).status_code == 422
    assert [w["logged_date"] for w in repo.weights] == ["2026-09-14"]


def test_update_weight_can_move_a_row_but_never_onto_another(make_client):
    a, b = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    repo = FakeRepo(weights=[
        {"id": a, "logged_date": "2026-09-10", "weight_kg": 78.0},
        {"id": b, "logged_date": "2026-09-11", "weight_kg": 77.5},
    ])
    c, _ = client_for(make_client, repo)
    ok = c.patch(f"/api/weight-logs/{a}", json={"loggedDate": "2026-09-09", "weightKg": 79})
    assert ok.status_code == 200
    clash = c.patch(f"/api/weight-logs/{a}", json={"loggedDate": "2026-09-11", "weightKg": 70})
    assert clash.status_code == 422 and clash.json()["detail"] == "You already have a weight logged for that date."
    by_id = {w["id"]: (w["logged_date"], w["weight_kg"]) for w in repo.weights}
    assert by_id == {a: ("2026-09-09", 79), b: ("2026-09-11", 77.5)}  # b untouched


def test_update_weight_unknown_id_and_bad_id(make_client):
    c, _ = client_for(make_client)
    body = {"loggedDate": "2026-09-10", "weightKg": 70}
    assert c.patch(f"/api/weight-logs/{UUID}", json=body).status_code == 422
    assert c.patch("/api/weight-logs/nope", json=body).status_code == 422


def test_delete_weight(make_client):
    repo = FakeRepo(weights=[{"id": UUID, "logged_date": "2026-09-10", "weight_kg": 78.0}])
    c, _ = client_for(make_client, repo)
    assert c.delete("/api/weight-logs/nope").status_code == 422
    assert c.delete(f"/api/weight-logs/{UUID}").status_code == 200
    assert repo.weights == []


# ---- storage failures ------------------------------------------------------


def test_storage_failure_returns_a_generic_message(make_client):
    from app.errors import StorageError

    class Broken(FakeRepo):
        def insert_entry(self, row):
            raise StorageError("Failed to add item")

    c = make_client(Broken())
    r = c.post("/api/entries", json=ENTRY_BODY)
    assert r.status_code == 500 and r.json() == {"detail": "Failed to add item"}
