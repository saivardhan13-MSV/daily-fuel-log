"""Calorie and macro targets from body inputs (Mifflin-St Jeor).
Ported from the app's original TypeScript implementation (removed once this
API took over); tests/fixtures/ts_target_parity.json holds outputs captured from
that code."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Goal = Literal["cut", "maintain", "bulk"]
Sex = Literal["male", "female"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]

ACTIVITY_MULTIPLIERS: dict[str, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

GOAL_CALORIE_MULTIPLIER: dict[str, float] = {"cut": 0.8, "maintain": 1.0, "bulk": 1.1}

# Protein scales with goal: higher in a deficit to preserve muscle.
GOAL_PROTEIN_PER_KG: dict[str, float] = {"cut": 2.2, "maintain": 1.8, "bulk": 1.6}

FAT_PERCENT_OF_CALORIES = 0.25


@dataclass(frozen=True)
class TargetInputs:
    weight_kg: float
    height_cm: float
    age: int
    sex: Sex
    activity_level: ActivityLevel
    goal: Goal


@dataclass(frozen=True)
class TargetMacros:
    calories: int
    protein: int
    carbs: int
    fat: int


def js_round(x: float) -> int:
    """Round half up, like JavaScript's Math.round. Python's built-in round()
    uses banker's rounding, which would make a ported target differ by 1 from
    the one the TypeScript app computed for the same inputs."""
    import math

    return math.floor(x + 0.5)


def calculate_bmr(i: TargetInputs) -> float:
    base = 10 * i.weight_kg + 6.25 * i.height_cm - 5 * i.age
    return base + 5 if i.sex == "male" else base - 161


def calculate_targets(i: TargetInputs) -> TargetMacros:
    tdee = calculate_bmr(i) * ACTIVITY_MULTIPLIERS[i.activity_level]
    calories = js_round(tdee * GOAL_CALORIE_MULTIPLIER[i.goal])

    protein = js_round(GOAL_PROTEIN_PER_KG[i.goal] * i.weight_kg)
    protein_cal = protein * 4

    fat_cal = calories * FAT_PERCENT_OF_CALORIES
    fat = js_round(fat_cal / 9)

    carbs_cal = max(calories - protein_cal - fat_cal, 0)
    carbs = js_round(carbs_cal / 4)

    return TargetMacros(calories=calories, protein=protein, carbs=carbs, fat=fat)
