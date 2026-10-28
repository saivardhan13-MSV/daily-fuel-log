"""Mutating endpoints. Validation mirrors the TypeScript server actions
(src/app/actions/*.ts) and is stricter where those relied on the database to
reject bad input. No body carries a user_id: the repository stamps it from the
verified token, and `extra="forbid"` rejects any attempt to send one."""

from __future__ import annotations

import math
import re
from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field

from ..deps import bad_request, date_param, get_repo, get_today, require_date, require_section
from ..domain.dates import is_valid_date_string, resolve_future_check_reference
from ..domain.targets import TargetInputs, calculate_targets
from ..domain.weight import is_valid_weight
from ..errors import DuplicateWeightDate
from ..repo import Repository
from ..sections import SECTION_KEYS

router = APIRouter(prefix="/api")

_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)

# JSON from Python's parser can carry NaN/Infinity; reject them at the type.
Num = Annotated[float, Field(allow_inf_nan=False)]

MAX_WATER_DELTA_ML = 10_000
MAX_NAME_LEN = 80
MAX_LABEL_LEN = 80


class Body(BaseModel):
    model_config = ConfigDict(extra="forbid")


def require_id(value: str) -> str:
    if not _UUID_RE.match(value):
        raise bad_request("Invalid request")
    return value


def _macros_ok(*values: float) -> bool:
    return all(math.isfinite(v) and v >= 0 for v in values)


# ---- entries ---------------------------------------------------------------


class AddEntryBody(Body):
    date: str
    section: str
    foodName: str
    qty: Num
    qtyLabel: str
    unit: Literal["g", "pc", "ml"]
    carbs: Num
    protein: Num
    fat: Num
    calories: Num


@router.post("/entries", status_code=201)
def add_entry(body: AddEntryBody, repo: Repository = Depends(get_repo)) -> dict[str, str]:
    require_date(body.date)
    require_section(body.section)
    name = body.foodName.strip()
    if not name or len(name) > MAX_NAME_LEN:
        raise bad_request(f"Food name must be 1-{MAX_NAME_LEN} characters")
    if not body.qtyLabel.strip() or len(body.qtyLabel) > MAX_LABEL_LEN:
        raise bad_request("Invalid quantity label")
    if not _macros_ok(body.qty, body.carbs, body.protein, body.fat, body.calories):
        raise bad_request("Quantity and nutrition values must be zero or more")
    entry_id = repo.insert_entry(
        {
            "entry_date": body.date,
            "section": body.section,
            "food_name": name,
            "qty": body.qty,
            "qty_label": body.qtyLabel,
            "unit": body.unit,
            "carbs": body.carbs,
            "protein": body.protein,
            "fat": body.fat,
            "calories": body.calories,
        }
    )
    return {"id": entry_id}


@router.delete("/entries/{entry_id}")
def remove_entry(entry_id: str, repo: Repository = Depends(get_repo)) -> dict[str, bool]:
    repo.delete_entry(require_id(entry_id))
    return {"ok": True}


@router.delete("/day")
def clear_day(date: str = Depends(date_param), repo: Repository = Depends(get_repo)) -> dict[str, bool]:
    repo.delete_day(date)
    return {"ok": True}


class CopyBody(Body):
    destDate: str
    sourceDate: str
    section: str | None = None  # None = the whole day, every section


@router.post("/copy")
def copy_entries(body: CopyBody, repo: Repository = Depends(get_repo)) -> dict[str, int]:
    """One bulk-copy path for 'previous meal' and 'previous day'. Source rows
    are re-read here, never taken from the client, and inserted in one batch
    stamped with the destination date. Each row keeps its original section."""
    dest = require_date(body.destDate, "destDate")
    source = require_date(body.sourceDate, "sourceDate")
    section = require_section(body.section) if body.section is not None else None
    if source >= dest:
        raise bad_request("Source date must be before the date you're viewing")

    by_section = repo.entries_for_date(source)
    wanted = [section] if section else list(SECTION_KEYS)
    source_rows = [item for key in wanted for item in by_section[key]]
    if not source_rows:
        raise bad_request("Nothing to copy from that date")

    rows = [
        {
            "entry_date": dest,
            "section": r["section"],
            "food_name": r["food_name"],
            "qty": r["qty"],
            "qty_label": r["qty_label"],
            "unit": r["unit"],
            "carbs": r["carbs"],
            "protein": r["protein"],
            "fat": r["fat"],
            "calories": r["calories"],
        }
        for r in source_rows
    ]
    return {"copiedCount": repo.insert_entries(rows)}


# ---- custom foods ----------------------------------------------------------


class CustomFoodBody(Body):
    name: str
    carbs: Num
    protein: Num
    fat: Num
    calories: Num
    pieceWeight: Num | None = None
    density: Num | None = None


@router.put("/custom-foods")
def upsert_custom_food(body: CustomFoodBody, repo: Repository = Depends(get_repo)) -> dict[str, bool]:
    name = body.name.strip().lower()
    if not name or len(name) > MAX_NAME_LEN:
        raise bad_request(f"Food name must be 1-{MAX_NAME_LEN} characters")
    if not _macros_ok(body.carbs, body.protein, body.fat, body.calories):
        raise bad_request("Nutrition values must be zero or more")
    for optional in (body.pieceWeight, body.density):
        if optional is not None and optional <= 0:
            raise bad_request("Piece weight and density must be greater than zero")
    repo.upsert_custom_food(
        {
            "name": name,
            "carbs": body.carbs,
            "protein": body.protein,
            "fat": body.fat,
            "calories": body.calories,
            "piece_weight": body.pieceWeight,
            "density": body.density,
        }
    )
    return {"ok": True}


# ---- water -----------------------------------------------------------------


class AddWaterBody(Body):
    date: str
    deltaMl: Num


class WaterDateBody(Body):
    date: str


@router.post("/water/add")
def add_water(body: AddWaterBody, repo: Repository = Depends(get_repo)) -> dict[str, float]:
    day = require_date(body.date)
    if abs(body.deltaMl) > MAX_WATER_DELTA_ML:
        raise bad_request(f"Water change must be within {MAX_WATER_DELTA_ML} ml")
    # Read-modify-write, as in the TypeScript. PostgREST has no atomic
    # increment, so two simultaneous taps can lose one; acceptable for a
    # single-user tap counter and noted in the README.
    new_amount = max(0.0, repo.water_intake_ml(day) + body.deltaMl)
    repo.set_water(day, new_amount)
    return {"amount_ml": new_amount}


@router.post("/water/reset")
def reset_water(body: WaterDateBody, repo: Repository = Depends(get_repo)) -> dict[str, float]:
    repo.set_water(require_date(body.date), 0.0)
    return {"amount_ml": 0.0}


# ---- body targets ----------------------------------------------------------


class TargetsBody(Body):
    weightKg: Num
    heightCm: Num
    age: int
    sex: Literal["male", "female"]
    activityLevel: Literal["sedentary", "light", "moderate", "active", "very_active"]
    goal: Literal["cut", "maintain", "bulk"]


@router.put("/body-targets")
def save_body_targets(body: TargetsBody, repo: Repository = Depends(get_repo)) -> dict[str, int]:
    if not (0 < body.weightKg < 500 and 50 <= body.heightCm <= 275 and 1 <= body.age <= 120):
        raise bad_request("Enter a valid weight, height and age")
    macros = calculate_targets(
        TargetInputs(
            weight_kg=body.weightKg,
            height_cm=body.heightCm,
            age=body.age,
            sex=body.sex,
            activity_level=body.activityLevel,
            goal=body.goal,
        )
    )
    repo.upsert_body_targets(
        {
            "weight_kg": body.weightKg,
            "height_cm": body.heightCm,
            "age": body.age,
            "sex": body.sex,
            "activity_level": body.activityLevel,
            "goal": body.goal,
            "target_calories": macros.calories,
            "target_protein": macros.protein,
            "target_carbs": macros.carbs,
            "target_fat": macros.fat,
        }
    )
    return {
        "calories": macros.calories,
        "protein": macros.protein,
        "carbs": macros.carbs,
        "fat": macros.fat,
    }


# ---- weight ----------------------------------------------------------------


class LogWeightBody(Body):
    loggedDate: str
    weightKg: float
    clientToday: str | None = None


class UpdateWeightBody(LogWeightBody):
    pass


def _check_weight_input(body: LogWeightBody, server_today: date) -> None:
    if not is_valid_date_string(body.loggedDate):
        raise bad_request("Invalid date")
    if not is_valid_weight(body.weightKg):
        raise bad_request("Enter a weight between 0 and 500 kg")
    reference = resolve_future_check_reference(body.clientToday, server_today.isoformat())
    if body.loggedDate > reference:
        raise bad_request("You can't log a future date")


@router.put("/weight-logs")
def log_weight(
    body: LogWeightBody,
    repo: Repository = Depends(get_repo),
    today: date = Depends(get_today),
) -> dict[str, bool]:
    """Upsert on (user, date): logging a date that already has a weigh-in
    corrects it, never creates a second row."""
    _check_weight_input(body, today)
    repo.upsert_weight(body.loggedDate, body.weightKg)
    return {"ok": True}


@router.patch("/weight-logs/{weight_id}")
def update_weight_log(
    weight_id: str,
    body: UpdateWeightBody,
    repo: Repository = Depends(get_repo),
    today: date = Depends(get_today),
) -> dict[str, bool]:
    """Correct an existing row by id. Unlike the upsert above the date itself
    may change, so moving onto a date that already has a different weigh-in
    must fail rather than silently overwrite it."""
    require_id(weight_id)
    _check_weight_input(body, today)
    try:
        found = repo.update_weight(weight_id, body.loggedDate, body.weightKg)
    except DuplicateWeightDate:
        raise bad_request("You already have a weight logged for that date.") from None
    if not found:
        raise bad_request("Weight entry not found")
    return {"ok": True}


@router.delete("/weight-logs/{weight_id}")
def delete_weight_log(weight_id: str, repo: Repository = Depends(get_repo)) -> dict[str, bool]:
    repo.delete_weight(require_id(weight_id))
    return {"ok": True}
