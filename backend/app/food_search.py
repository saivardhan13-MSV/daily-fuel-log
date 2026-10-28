"""USDA FoodData Central search. Ports src/app/api/food-search/route.ts."""

from __future__ import annotations

from typing import Any

import httpx

USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

# USDA nutrient numbers (stable across food types):
# Energy (kcal) = 208, Protein = 203, Fat = 204, Carbohydrate by difference = 205.
_ENERGY, _PROTEIN, _FAT, _CARBS = "208", "203", "204", "205"


def _pick_nutrient(nutrients: list[dict[str, Any]], number: str) -> float | None:
    for n in nutrients:
        if n.get("nutrientNumber") != number:
            continue
        # Energy is also reported in kJ; only the kcal row is wanted.
        if number == _ENERGY and n.get("unitName") != "KCAL":
            continue
        value = n.get("value")
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return float(value)
    return None


def parse_usda_foods(payload: dict[str, Any]) -> list[dict[str, Any]]:
    foods = payload.get("foods")
    if not isinstance(foods, list):
        return []

    out: list[dict[str, Any]] = []
    for food in foods:
        nutrients = food.get("foodNutrients")
        nutrients = nutrients if isinstance(nutrients, list) else []
        cal = _pick_nutrient(nutrients, _ENERGY)
        protein = _pick_nutrient(nutrients, _PROTEIN)
        fat = _pick_nutrient(nutrients, _FAT)
        carbs = _pick_nutrient(nutrients, _CARBS)
        name = food.get("description")

        if not name or None in (cal, protein, fat, carbs):
            continue  # incomplete macro data is skipped rather than guessed at

        brand = food.get("brandOwner")
        out.append(
            {
                "name": str(name).strip()[:80],
                "carbs": carbs,
                "protein": protein,
                "fat": fat,
                "cal": cal,
                "source": str(brand)[:30] if brand else "USDA",
            }
        )
    return out


def search_usda(
    query: str, api_key: str | None, client: httpx.Client | None = None
) -> list[dict[str, Any]]:
    """Fails soft: with no key, a timeout, or a non-200 the caller still gets
    an empty list, so the local food list keeps working."""
    if not api_key:
        return []

    params = {"api_key": api_key, "query": query, "pageSize": "8"}
    try:
        if client is not None:
            res = client.get(USDA_URL, params=params, timeout=5.0)
        else:
            with httpx.Client(timeout=5.0) as c:
                res = c.get(USDA_URL, params=params)
        if res.status_code != 200:
            return []
        return parse_usda_foods(res.json())
    except (httpx.HTTPError, ValueError):
        return []
