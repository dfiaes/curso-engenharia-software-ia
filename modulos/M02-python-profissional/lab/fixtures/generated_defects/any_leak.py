from typing import Any, cast


def trusted_amount(payload: Any) -> int:
    # Defeito: cast não valida e Any silencia o checker.
    return cast(int, payload["amount"])
