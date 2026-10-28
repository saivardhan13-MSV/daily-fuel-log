from datetime import date

import pytest

from app.domain.dates import (
    date_sequence,
    days_between,
    is_valid_date_string,
    range_bounds,
    resolve_future_check_reference,
)


@pytest.mark.parametrize(
    "value",
    ["2026-09-13", "2028-02-29", "2000-02-29", "2026-01-01", "2026-12-31"],
)
def test_valid_dates(value):
    assert is_valid_date_string(value)


@pytest.mark.parametrize(
    "value",
    [
        "2026-13-40",  # impossible month and day
        "2026-02-30",  # Feb 30 never exists
        "2026-02-29",  # 2026 is not a leap year
        "1900-02-29",  # century non-leap year
        "2026-04-31",  # April has 30 days
        "abc",
        "",
        "2026-9-1",  # not zero-padded
        "2026-09-13T00:00:00",
        None,
        20260913,
    ],
)
def test_invalid_dates(value):
    assert not is_valid_date_string(value)


@pytest.mark.parametrize("days", [7, 30])
@pytest.mark.parametrize(
    "today",
    [
        date(2026, 9, 13),  # ordinary
        date(2026, 9, 3),  # 30d crosses a month boundary
        date(2026, 1, 5),  # crosses a year boundary
        date(2028, 2, 29),  # leap day itself
        date(2028, 3, 5),  # 30d spans a leap February
        date(2026, 3, 9),  # US DST spring-forward week
        date(2026, 11, 2),  # US DST fall-back week
    ],
)
def test_range_bounds_is_exactly_n_dates_ending_today(days, today):
    start, end = range_bounds(days, today)
    seq = date_sequence(start, end)
    assert len(seq) == days
    assert seq[-1] == today.isoformat() == end
    assert seq[0] == start
    assert len(set(seq)) == days  # no duplicated or skipped calendar day


def test_range_bounds_known_values():
    assert range_bounds(7, date(2026, 9, 13)) == ("2026-09-07", "2026-09-13")
    assert range_bounds(30, date(2026, 9, 13)) == ("2026-08-15", "2026-09-13")
    assert range_bounds(7, date(2026, 1, 5)) == ("2025-12-30", "2026-01-05")


def test_range_bounds_rejects_non_positive():
    with pytest.raises(ValueError):
        range_bounds(0, date(2026, 9, 13))


def test_days_between_is_signed():
    assert days_between("2026-09-14", "2026-09-13") == 1
    assert days_between("2026-09-12", "2026-09-13") == -1


class TestFutureCheckReference:
    SERVER = "2026-09-13"

    def test_client_one_day_ahead_is_trusted(self):
        # A user just past local midnight in India while the server is still on UTC.
        assert resolve_future_check_reference("2026-09-14", self.SERVER) == "2026-09-14"

    def test_client_one_day_behind_is_trusted(self):
        assert resolve_future_check_reference("2026-09-12", self.SERVER) == "2026-09-12"

    def test_same_day_is_trusted(self):
        assert resolve_future_check_reference(self.SERVER, self.SERVER) == self.SERVER

    def test_spoofed_far_future_falls_back_to_server(self):
        assert resolve_future_check_reference("2099-01-01", self.SERVER) == self.SERVER

    def test_two_days_ahead_is_not_a_real_timezone(self):
        assert resolve_future_check_reference("2026-09-15", self.SERVER) == self.SERVER

    def test_malformed_or_missing_falls_back(self):
        assert resolve_future_check_reference("not-a-date", self.SERVER) == self.SERVER
        assert resolve_future_check_reference("2026-02-30", self.SERVER) == self.SERVER
        assert resolve_future_check_reference(None, self.SERVER) == self.SERVER
