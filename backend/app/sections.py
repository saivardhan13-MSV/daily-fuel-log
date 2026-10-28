"""Meal sections. Mirrors SECTIONS in src/lib/food-db.ts and the CHECK
constraint on daily_entries.section."""

SECTION_KEYS: tuple[str, ...] = (
    "breakfast",
    "midMorningSnack",
    "lunch",
    "eveningSnack",
    "preWorkout",
    "postWorkout",
    "dinner",
)


def is_valid_section(value: object) -> bool:
    return isinstance(value, str) and value in SECTION_KEYS
