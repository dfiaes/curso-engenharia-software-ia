"""Detect and redact Brazilian PII in free text (CPF, e-mail, phone).

A detector is a filter with two error modes. Here the bias is explicit: a CPF-shaped
number that passes the check digits is redacted even when it is "really" an order id,
because a missed CPF in a log is worse than a masked order id.
"""

import hashlib
import hmac
import logging
import re
from dataclasses import dataclass
from enum import StrEnum


class PiiKind(StrEnum):
    CPF = "CPF"
    EMAIL = "EMAIL"
    PHONE = "TELEFONE"


@dataclass(frozen=True)
class PiiMatch:
    """A hit by position only. The matched value is deliberately not stored."""

    kind: PiiKind
    start: int
    end: int


_CPF = re.compile(r"(?<!\d)(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})(?!\d)")
_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+")
# Mobile: optional +55, DDD (11-99), then 9 + 8 digits. May be unformatted.
_MOBILE = re.compile(r"(?<!\d)(?:\+55[ -]?)?(?:\(?[1-9][1-9]\)?[ -]?)9\d{4}[ -]?\d{4}(?!\d)")
# Landline: 8 digits starting 2-5. Needs "(DDD)" or "DDD " so that 10-digit ids do not match.
_LANDLINE = re.compile(
    r"(?<!\d)(?:\+55[ -]?)?(?:\([1-9][1-9]\)[ -]?|[1-9][1-9][ -])[2-5]\d{3}[ -]?\d{4}(?!\d)"
)


def is_valid_cpf(digits: str) -> bool:
    """Check the two verification digits (modulo 11). Repeated digits are rejected."""
    if len(digits) != 11 or not digits.isdigit() or digits == digits[0] * 11:
        return False
    for n in (9, 10):
        total = sum(int(d) * w for d, w in zip(digits[:n], range(n + 1, 1, -1), strict=True))
        if (total * 10) % 11 % 10 != int(digits[n]):
            return False
    return True


def scan(text: str) -> list[PiiMatch]:
    """Non-overlapping matches in text order. CPF wins over phone, e-mail over both."""
    candidates: list[PiiMatch] = []
    for m in _CPF.finditer(text):
        if is_valid_cpf(re.sub(r"\D", "", m.group())):
            candidates.append(PiiMatch(PiiKind.CPF, m.start(), m.end()))
    candidates.extend(PiiMatch(PiiKind.EMAIL, m.start(), m.end()) for m in _EMAIL.finditer(text))
    for pattern in (_MOBILE, _LANDLINE):
        candidates.extend(
            PiiMatch(PiiKind.PHONE, m.start(), m.end()) for m in pattern.finditer(text)
        )
    chosen: list[PiiMatch] = []
    # Stable order of preference is the insertion order above: CPF, e-mail, phone.
    for cand in candidates:
        if all(cand.end <= c.start or cand.start >= c.end for c in chosen):
            chosen.append(cand)
    return sorted(chosen, key=lambda c: c.start)


def _token(kind: PiiKind, value: str, key: bytes | None) -> str:
    if key is None:
        return f"[{kind}]"
    canon = value.lower() if kind is PiiKind.EMAIL else re.sub(r"\D", "", value)
    digest = hmac.new(key, f"{kind}:{canon}".encode(), hashlib.sha256).hexdigest()[:8]
    return f"[{kind}:{digest}]"


def redact(text: str, *, key: bytes | None = None) -> str:
    """Replace each hit by a tag. With a key the tag carries a keyed hash (pseudonymisation),
    so the same person correlates across log lines without the value being recoverable."""
    out: list[str] = []
    pos = 0
    for m in scan(text):
        out.append(text[pos : m.start])
        out.append(_token(m.kind, text[m.start : m.end], key))
        pos = m.end
    out.append(text[pos:])
    return "".join(out)


class RedactingFilter(logging.Filter):
    """Redact the formatted message before any handler sees it.

    Limit: exception text and tracebacks (``exc_info``) are formatted later by the
    handler and are not covered here.
    """

    def __init__(self, key: bytes | None = None) -> None:
        super().__init__()
        self._key = key

    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = redact(record.getMessage(), key=self._key)
        record.args = None
        return True
