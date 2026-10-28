"""Response shapes. Field names match the TypeScript types the frontend
already consumes (EntryItem, DayTotals, WeightLogRow, ...), so the cutover
doesn't require touching components."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Unit = Literal["g", "pc", "ml"]


class EntryItem(BaseModel):
    id: str
    section: str
    food_name: str
    qty: float
    qty_label: str
    unit: Unit
    carbs: float
    protein: float
    fat: float
    calories: float


class CustomFood(BaseModel):
    id: str
    name: str
    carbs: float
    protein: float
    fat: float
    calories: float
    piece_weight: float | None = None
    density: float | None = None


class BodyTargets(BaseModel):
    weight_kg: float | None = None
    height_cm: float | None = None
    age: int | None = None
    sex: Literal["male", "female"] | None = None
    activity_level: str | None = None
    goal: Literal["cut", "maintain", "bulk"] | None = None
    target_calories: float | None = None
    target_protein: float | None = None
    target_carbs: float | None = None
    target_fat: float | None = None


class QuickAddSuggestion(BaseModel):
    foodName: str
    qty: float
    qtyLabel: str
    unit: Unit
    carbs: float
    protein: float
    fat: float
    calories: float


class DayTotals(BaseModel):
    date: str
    cal: float
    protein: float
    carbs: float
    fat: float
    logged: bool


class DateRange(BaseModel):
    start: str
    end: str


class TrendsResponse(BaseModel):
    range: DateRange
    days: list[DayTotals]


class WeightLog(BaseModel):
    id: str
    logged_date: str
    weight_kg: float


class WeightLogsResponse(BaseModel):
    range: DateRange
    logs: list[WeightLog]


class MealCopyPreview(BaseModel):
    sourceDate: str
    items: list[EntryItem]


class DayCopyPreview(BaseModel):
    sourceDate: str
    entries: dict[str, list[EntryItem]]


class FoodSearchResult(BaseModel):
    name: str
    carbs: float
    protein: float
    fat: float
    cal: float
    source: str
