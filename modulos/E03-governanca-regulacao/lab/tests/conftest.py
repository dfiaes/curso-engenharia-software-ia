from copy import deepcopy
from datetime import date
from pathlib import Path
from typing import Any

import pytest

from aigov.models import AISystemRecord

TODAY = date(2026, 10, 11)
EXAMPLES = Path(__file__).resolve().parent.parent / "examples"

CLEAN: dict[str, Any] = {
    "id": "assistente-teste",
    "name": "Assistente de teste",
    "owner": "time-plataforma",
    "purpose": "Responder perguntas internas sobre procedimentos de suporte.",
    "lifecycle": "production",
    "risk_tier": "limited",
    "risk_rationale": "Chatbot interno sem decisão sobre pessoas.",
    "personal_data": {"processes": True, "categories": ["nome"], "sensitive": False},
    "legal_basis": "contract",
    "stores": [
        {
            "kind": "prompt_log",
            "holds_personal_data": True,
            "retention_days": 30,
            "erasure_supported": True,
        }
    ],
    "provider": {
        "name": "ProvedorExemplo",
        "country": "BR",
        "trains_on_inputs": False,
    },
    "assessments": [
        {"kind": "eval_report", "done_on": "2026-09-01", "reference": "EVAL-1"},
    ],
    "incident_plan": "runbooks/ia.md",
    "user_facing_generative": True,
    "ai_disclosure": True,
}


@pytest.fixture
def raw() -> dict[str, Any]:
    return deepcopy(CLEAN)


def make(data: dict[str, Any]) -> AISystemRecord:
    return AISystemRecord.model_validate(data)


@pytest.fixture
def clean_record(raw: dict[str, Any]) -> AISystemRecord:
    return make(raw)
