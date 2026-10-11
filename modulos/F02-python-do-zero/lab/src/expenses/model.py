"""The domain value object."""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class Expense:
    """One validated expense. Frozen: instances are hashable and cannot drift."""

    date: dt.date
    category: str
    amount: Decimal
    description: str = ""
