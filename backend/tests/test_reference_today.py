"""The optional `today` param on date-window reads (server TODAY = 2026-09-13)."""

from __future__ import annotations

import pytest

from tests.conftest import FakeRepo, entry


@pytest.mark.parametrize("path", ["/api/trends", "/api/weight-logs"])
def test_window_ends_on_callers_today_within_one_day(make_client, path):
    c = make_client(FakeRepo())
    assert c.get(path, params={"days": 7}).json()["range"] == {"start": "2026-09-07", "end": "2026-09-13"}
    for ahead in ("2026-09-14", "2026-09-12"):
        got = c.get(path, params={"days": 7, "today": ahead}).json()["range"]["end"]
        assert got == ahead


@pytest.mark.parametrize("bogus", ["2026-09-20", "2025-01-01", "2026-02-30", "garbage"])
@pytest.mark.parametrize("path", ["/api/trends", "/api/weight-logs"])
def test_a_spoofed_today_falls_back_to_the_server_date(make_client, path, bogus):
    c = make_client(FakeRepo())
    assert c.get(path, params={"days": 7, "today": bogus}).json()["range"]["end"] == "2026-09-13"


def test_streak_uses_callers_today(make_client):
    # Logged on the 13th and 14th. Server date is the 13th, caller (ahead of UTC) is on the 14th.
    repo = FakeRepo(entries=[entry("a", "2026-09-13", "lunch", "A", 1), entry("b", "2026-09-14", "lunch", "B", 1)])
    c = make_client(repo)
    assert c.get("/api/streak").json() == {"streak": 1}
    assert c.get("/api/streak", params={"today": "2026-09-14"}).json() == {"streak": 2}
