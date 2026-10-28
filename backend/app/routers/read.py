"""Read endpoints. Phase 2 adds the mutating ones (entries, copy, water,
targets, weight)."""

from __future__ import annotations

import calendar
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query

from ..auth import AuthedUser, get_current_user
from ..config import Settings, get_settings
from ..deps import bad_request, date_param, get_repo, get_today, require_date, require_section
from ..domain.dates import range_bounds
from ..domain.quickadd import rank_suggestions
from ..domain.streak import compute_streak
from ..domain.trends import build_daily_totals
from ..food_search import search_usda
from ..models import (
    BodyTargets,
    CustomFood,
    DayCopyPreview,
    EntryItem,
    FoodSearchResult,
    MealCopyPreview,
    QuickAddSuggestion,
    TrendsResponse,
    WeightLogsResponse,
)
from ..repo import Repository

router = APIRouter(prefix="/api")

# Same bound getStreak uses: enough history for any realistic streak without
# downloading the user's whole log.
STREAK_LOOKBACK_ROWS = 2000
QUICKADD_LOOKBACK_ROWS = 200
MAX_RANGE_DAYS = 90


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/me")
def me(user: AuthedUser = Depends(get_current_user)) -> dict[str, str]:
    return {"user_id": user.user_id}


@router.get("/day", response_model=dict[str, list[EntryItem]])
def day(date: str = Depends(date_param), repo: Repository = Depends(get_repo)):
    """Every entry for one date, grouped by meal section."""
    return repo.entries_for_date(date)


@router.get("/custom-foods", response_model=list[CustomFood])
def custom_foods(repo: Repository = Depends(get_repo)):
    return repo.custom_foods()


@router.get("/body-targets", response_model=BodyTargets | None)
def body_targets(repo: Repository = Depends(get_repo)):
    return repo.body_targets()


@router.get("/water")
def water(date: str = Depends(date_param), repo: Repository = Depends(get_repo)) -> dict[str, float]:
    return {"amount_ml": repo.water_intake_ml(date)}


@router.get("/streak")
def streak(repo: Repository = Depends(get_repo), today: date = Depends(get_today)) -> dict[str, int]:
    return {"streak": compute_streak(repo.logged_dates(STREAK_LOOKBACK_ROWS), today)}


@router.get("/quick-add", response_model=dict[str, list[QuickAddSuggestion]])
def quick_add(repo: Repository = Depends(get_repo)):
    return rank_suggestions(repo.quickadd_rows(QUICKADD_LOOKBACK_ROWS), datetime.now(timezone.utc))


def _validated_days(days: int) -> int:
    if not 1 <= days <= MAX_RANGE_DAYS:
        raise bad_request(f"days must be between 1 and {MAX_RANGE_DAYS}")
    return days


@router.get("/trends", response_model=TrendsResponse)
def trends(
    days: int = Query(30),
    repo: Repository = Depends(get_repo),
    today: date = Depends(get_today),
):
    """Per-day totals over a bounded window, fetched with one query. The 7-day
    view is a slice of the 30-day one, so clients never re-query to switch."""
    start, end = range_bounds(_validated_days(days), today)
    return {
        "range": {"start": start, "end": end},
        "days": build_daily_totals(repo.daily_rows(start, end), start, end),
    }


@router.get("/weight-logs", response_model=WeightLogsResponse)
def weight_logs(
    days: int = Query(30),
    repo: Repository = Depends(get_repo),
    today: date = Depends(get_today),
):
    """Real weigh-ins only (no zero-filling), over the same window as /trends."""
    start, end = range_bounds(_validated_days(days), today)
    return {"range": {"start": start, "end": end}, "logs": repo.weight_logs(start, end)}


@router.get("/month-totals")
def month_totals(
    year: int = Query(..., ge=1970, le=2200),
    month: int = Query(..., ge=0, le=11, description="0-11, like JS Date months"),
    repo: Repository = Depends(get_repo),
) -> dict[str, float]:
    last_day = calendar.monthrange(year, month + 1)[1]
    start = f"{year:04d}-{month + 1:02d}-01"
    end = f"{year:04d}-{month + 1:02d}-{last_day:02d}"

    totals: dict[str, float] = {}
    for row in repo.month_rows(start, end):
        key = str(row["entry_date"])
        totals[key] = totals.get(key, 0.0) + float(row.get("calories") or 0)
    return totals


@router.get("/copy/meal-preview", response_model=MealCopyPreview | None)
def meal_copy_preview(
    dest_date: str = Query(...),
    section: str = Query(...),
    repo: Repository = Depends(get_repo),
):
    """The nearest earlier date that has entries in this section, or null."""
    dest = require_date(dest_date, "dest_date")
    sec = require_section(section)
    source = repo.nearest_prior_logged_date(dest, sec)
    if source is None:
        return None
    return {"sourceDate": source, "items": repo.entries_for_date(source)[sec]}


@router.get("/copy/day-preview", response_model=DayCopyPreview | None)
def day_copy_preview(
    dest_date: str = Query(...),
    source_date: str | None = Query(None),
    repo: Repository = Depends(get_repo),
):
    dest = require_date(dest_date, "dest_date")
    source = require_date(source_date, "source_date") if source_date else repo.nearest_prior_logged_date(dest, None)
    if source is None:
        return None
    if source >= dest:
        raise bad_request("Pick a date before the one you're viewing")
    return {"sourceDate": source, "entries": repo.entries_for_date(source)}


@router.get("/copy/recent-dates", response_model=list[str])
def recent_copy_dates(dest_date: str = Query(...), repo: Repository = Depends(get_repo)):
    return repo.recent_logged_dates(require_date(dest_date, "dest_date"), 8)


@router.get("/food-search", response_model=list[FoodSearchResult])
def food_search(
    q: str = Query("", description="At least 3 characters"),
    _user: AuthedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    query = q.strip()
    if len(query) < 3:
        return []
    return search_usda(query, settings.usda_fdc_api_key)
