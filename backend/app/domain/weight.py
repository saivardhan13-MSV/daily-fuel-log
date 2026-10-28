"""Weight validation. Same bounds as the weight_logs CHECK constraint."""

import math

MAX_WEIGHT_KG = 500


def is_valid_weight(value: object) -> bool:
    """Finite and 0 < w < 500. The closed range matters: Postgres numeric
    orders NaN above every number, so an open-ended '> 0' check alone would
    let NaN and Infinity through."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return math.isfinite(value) and 0 < value < MAX_WEIGHT_KG
