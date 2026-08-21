from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import ValidationError
from work_intake.application.boundary import (
    BoundaryError,
    WorkRequestV1,
    WorkRequestV2,
    parse_work_request_json,
)


def _load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    ("schema_name", "fixture_path"),
    [
        ("work-request.v1.schema.json", "fixtures/golden/request-v1.json"),
        ("work-request.v2.schema.json", "fixtures/compatibility/request-v2.json"),
    ],
)
def test_declared_contract_versions_validate(
    lab_root: Path, schema_name: str, fixture_path: str
) -> None:
    schema = _load(lab_root / "contracts" / schema_name)
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(
        _load(lab_root / fixture_path)
    )


def test_extra_field_is_rejected_by_schema_and_trust_boundary(lab_root: Path) -> None:
    payload = _load(lab_root / "fixtures/adversarial/request-extra-field.json")
    schema = _load(lab_root / "contracts/work-request.v1.schema.json")
    with pytest.raises(ValidationError):
        Draft202012Validator(schema).validate(payload)
    with pytest.raises(BoundaryError) as captured:
        parse_work_request_json(json.dumps(payload))
    assert captured.value.fields == ("is_admin",)
    assert "true" not in str(captured.value)


def test_v1_v2_json_schema_and_pydantic_fields_cannot_drift(lab_root: Path) -> None:
    schema_v1 = _load(lab_root / "contracts/work-request.v1.schema.json")
    schema_v2 = _load(lab_root / "contracts/work-request.v2.schema.json")
    assert set(schema_v1["properties"]) == set(WorkRequestV1.model_fields)
    assert set(schema_v2["properties"]) == set(WorkRequestV2.model_fields)


def test_v2_compatibility_is_explicit_and_incompatible_version_blocks(lab_root: Path) -> None:
    compatibility = _load(lab_root / "contracts/compatibility.json")
    assert compatibility["current_consumer"] == "2.0"
    assert compatibility["accepted_inputs"] == ["1.0", "2.0"]
    incompatible = _load(lab_root / "fixtures/golden/request-v1.json")
    incompatible["schema_version"] = "3.0"
    with pytest.raises(BoundaryError) as captured:
        parse_work_request_json(json.dumps(incompatible))
    assert captured.value.fields == ("schema_version",)


def test_decimal_timezone_and_utf8_survive_boundary(request_v1_payload: dict[str, Any]) -> None:
    request_v1_payload["intent"] = "Revisar documentação: ação, segurança e operação."
    request = parse_work_request_json(json.dumps(request_v1_payload, ensure_ascii=False))
    assert str(request.budget) == "750.00"
    assert request.deadline_at.utcoffset() is not None
    assert "ação" in request.intent
