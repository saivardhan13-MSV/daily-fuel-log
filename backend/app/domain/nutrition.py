"""Macro totals. Mirrors src/lib/nutrition.ts."""

from __future__ import annotations

import math
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any


def safe_num(value: Any) -> float:
    """Coerce Supabase numeric values (which may arrive as strings) to a
    finite float; anything unusable counts as 0."""
    try:
        n = float(value)
    except (TypeError, ValueError):
        return 0.0
    return n if math.isfinite(n) else 0.0


def round1(value: Any) -> float:
    return round(safe_num(value) * 10) / 10


@dataclass
class Totals:
    carbs: float = 0.0
    protein: float = 0.0
    fat: float = 0.0
    cal: float = 0.0

    def add(self, other: "Totals") -> None:
        self.carbs += other.carbs
        self.protein += other.protein
        self.fat += other.fat
        self.cal += other.cal


def totals_for_items(items: Iterable[Mapping[str, Any]]) -> Totals:
    t = Totals()
    for it in items:
        t.carbs += safe_num(it.get("carbs"))
        t.protein += safe_num(it.get("protein"))
        t.fat += safe_num(it.get("fat"))
        t.cal += safe_num(it.get("calories"))
    return t


def totals_for_entries(entries: Mapping[str, Iterable[Mapping[str, Any]]]) -> Totals:
    t = Totals()
    for items in entries.values():
        t.add(totals_for_items(items))
    return t
