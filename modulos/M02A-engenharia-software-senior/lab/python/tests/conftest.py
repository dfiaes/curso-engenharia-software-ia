from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

LAB_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def lab_root() -> Path:
    return LAB_ROOT


@pytest.fixture
def request_v1_payload(lab_root: Path) -> dict[str, Any]:
    path = lab_root / "fixtures" / "golden" / "request-v1.json"
    payload: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return payload
