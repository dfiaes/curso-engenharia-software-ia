"""Trust boundary JSON: valida sintaxe, versão e tipos antes do domínio."""

from __future__ import annotations

import json
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from work_intake.domain.models import Priority, WorkRequest

MONEY_PATTERN = re.compile(r"^(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?$")


class BoundaryError(ValueError):
    def __init__(self, fields: tuple[str, ...], *, cause: Exception | None = None) -> None:
        self.fields = fields
        message = "work request inválido"
        if fields:
            message += f"; revise: {', '.join(fields)}"
        super().__init__(message)
        if cause is not None:
            self.__cause__ = cause


class _RequestBase(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    request_id: str = Field(pattern=r"^req-[a-z0-9][a-z0-9-]{2,63}$")
    tenant_id: str = Field(pattern=r"^tenant-[a-z0-9][a-z0-9-]{1,63}$")
    intent: str = Field(min_length=1, max_length=2000)
    priority: Literal["low", "normal", "high", "critical"]
    budget: str
    deadline_at: str
    idempotency_key: str = Field(pattern=r"^idem-[A-Za-z0-9_-]{8,120}$")

    @field_validator("intent")
    @classmethod
    def reject_blank_intent(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("intent não pode conter apenas whitespace")
        return value

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, value: str) -> str:
        if MONEY_PATTERN.fullmatch(value) is None:
            raise ValueError("budget deve ser decimal JSON em string com até duas casas")
        return value

    @field_validator("deadline_at")
    @classmethod
    def validate_deadline(cls, value: str) -> str:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("deadline_at deve ser RFC 3339") from exc
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            raise ValueError("deadline_at deve possuir timezone")
        return value

    def to_domain(self, *, contract_version: str, source: str | None) -> WorkRequest:
        try:
            budget = Decimal(self.budget)
        except InvalidOperation as exc:  # coberto pelo regex; defesa contra regressão
            raise BoundaryError(("budget",), cause=exc) from exc
        return WorkRequest(
            contract_version=contract_version,
            request_id=self.request_id,
            tenant_id=self.tenant_id,
            intent=self.intent,
            priority=Priority(self.priority),
            budget=budget,
            deadline_at=datetime.fromisoformat(self.deadline_at.replace("Z", "+00:00")),
            idempotency_key=self.idempotency_key,
            source=source,
        )


class WorkRequestV1(_RequestBase):
    schema_version: Literal["1.0"]


class WorkRequestV2(_RequestBase):
    schema_version: Literal["2.0"]
    source: Literal["cli", "import", "automation"] = "import"


def parse_work_request_json(text: str) -> WorkRequest:
    try:
        payload: Any = json.loads(text)
    except json.JSONDecodeError as exc:
        raise BoundaryError(("json",), cause=exc) from exc
    if not isinstance(payload, dict):
        raise BoundaryError(("root",))
    version = payload.get("schema_version")
    model_type: type[WorkRequestV1] | type[WorkRequestV2]
    if version == "1.0":
        model_type = WorkRequestV1
    elif version == "2.0":
        model_type = WorkRequestV2
    else:
        raise BoundaryError(("schema_version",))
    try:
        model = model_type.model_validate(payload)
    except ValidationError as exc:
        fields = tuple(sorted({str(error["loc"][0]) for error in exc.errors()}))
        raise BoundaryError(fields, cause=exc) from exc
    if isinstance(model, WorkRequestV2):
        return model.to_domain(contract_version="2.0", source=model.source)
    return model.to_domain(contract_version="1.0", source=None)
