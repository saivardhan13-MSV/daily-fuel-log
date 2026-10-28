from __future__ import annotations

from datetime import date

from fastapi import Depends, HTTPException, Query

from .auth import AuthedUser, get_current_user, user_scoped_client
from .config import Settings, get_settings
from .domain.dates import is_valid_date_string
from .repo import Repository, SupabaseRepository
from .sections import is_valid_section


def get_repo(
    user: AuthedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> Repository:
    return SupabaseRepository(user_scoped_client(user, settings), user.user_id)


def get_today() -> date:
    """Overridable in tests. Server-local calendar date, the same convention
    the Next.js app uses for its own 'today'."""
    return date.today()


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=422, detail=message)


def require_date(value: str, name: str = "date") -> str:
    if not is_valid_date_string(value):
        raise bad_request(f"{name} must be a real calendar date in YYYY-MM-DD format")
    return value


def date_param(date: str = Query(..., description="YYYY-MM-DD")) -> str:
    return require_date(date)


def require_section(value: str) -> str:
    if not is_valid_section(value):
        raise bad_request("Unknown meal section")
    return value
