from __future__ import annotations

from dataclasses import replace
from decimal import Decimal
from pathlib import Path

from hypothesis import given
from hypothesis import strategies as st
from work_intake.application.boundary import parse_work_request_json
from work_intake.domain.models import WorkRequest

LAB_ROOT = Path(__file__).resolve().parents[2]


def _request(lab_root: Path) -> WorkRequest:
    return parse_work_request_json(
        (lab_root / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )


@given(cents=st.integers(min_value=0, max_value=99_999_999))
def test_idempotency_hash_canonicalizes_equivalent_decimal_scales(
    cents: int,
) -> None:
    request = _request(LAB_ROOT)
    compact = Decimal(cents) / Decimal(100)
    fixed = Decimal(f"{cents // 100}.{cents % 100:02d}")
    assert (
        replace(request, budget=compact).intent_hash == replace(request, budget=fixed).intent_hash
    )
