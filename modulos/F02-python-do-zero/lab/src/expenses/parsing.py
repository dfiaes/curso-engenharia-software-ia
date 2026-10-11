"""Text to domain values. Every failure becomes an InvalidRowError with its location."""

from __future__ import annotations

import datetime as dt
import re
import unicodedata
from collections.abc import Mapping
from decimal import Decimal

from expenses.errors import InvalidRowError
from expenses.model import Expense

REQUIRED_COLUMNS = ("date", "category", "amount", "description")

# [0-9], not \d: in a str pattern \d also matches digits of other scripts.
AMOUNT_RE = re.compile(r"[0-9]+(?:[.,][0-9]{1,2})?")


def parse_amount(line: int, text: str) -> Decimal:
    """Parse '12.5' or '12,50' into a positive Decimal with exactly two places."""
    raw = text.strip()
    if not AMOUNT_RE.fullmatch(raw):
        raise InvalidRowError(line, "amount", f"valor inválido: {text!r}")
    value = Decimal(raw.replace(",", ".")).quantize(Decimal("0.01"))
    if value <= 0:
        raise InvalidRowError(line, "amount", "o valor deve ser maior que zero")
    return value


def parse_date(line: int, text: str) -> dt.date:
    """Parse an ISO 8601 calendar date (YYYY-MM-DD)."""
    try:
        return dt.date.fromisoformat(text.strip())
    except ValueError as err:
        raise InvalidRowError(line, "date", f"data inválida: {text!r}") from err


def normalize_category(text: str) -> str:
    """Trim, collapse inner whitespace, NFC-normalize and casefold."""
    collapsed = " ".join(text.split())
    return unicodedata.normalize("NFC", collapsed).casefold()


def parse_row(line: int, row: Mapping[str, str | None]) -> Expense:
    """Build an Expense from one CSV record or raise InvalidRowError."""
    category = normalize_category(row.get("category") or "")
    if not category:
        raise InvalidRowError(line, "category", "categoria vazia")
    return Expense(
        date=parse_date(line, row.get("date") or ""),
        category=category,
        amount=parse_amount(line, row.get("amount") or ""),
        description=(row.get("description") or "").strip(),
    )
