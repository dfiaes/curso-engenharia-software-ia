"""Adapter offline que reproduz respostas versionadas e validadas."""

from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from work_intake.domain.models import (
    AdvisorIdentity,
    Advisory,
    AdvisoryCategory,
    Risk,
    WorkRequest,
)
from work_intake.ports.advisor import AdvisorError


class _RecordedAdvisory(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    category: Literal["delivery", "operations", "security", "unknown"]
    risk: Literal["low", "medium", "high", "unknown"]
    confidence: str = Field(pattern=r"^(0(\.[0-9]{1,4})?|1(\.0{1,4})?)$")
    signals: list[str] = Field(max_length=12)

    def to_domain(self) -> Advisory:
        return Advisory(
            category=AdvisoryCategory(self.category),
            risk=Risk(self.risk),
            confidence=Decimal(self.confidence),
            signals=tuple(self.signals),
        )


class _Recording(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    recording_version: Literal["1.0"]
    adapter: str = Field(min_length=1)
    adapter_version: str = Field(min_length=1)
    entries: dict[str, _RecordedAdvisory]


class RecordReplayAdvisor:
    def __init__(self, path: Path) -> None:
        try:
            raw = path.read_bytes()
            payload = json.loads(raw)
            self._recording = _Recording.model_validate(payload)
        except (OSError, json.JSONDecodeError, ValidationError) as exc:
            raise AdvisorError("recording inválido") from exc
        self._identity = AdvisorIdentity(
            adapter=self._recording.adapter,
            version=self._recording.adapter_version,
            digest=hashlib.sha256(raw).hexdigest(),
        )

    @property
    def identity(self) -> AdvisorIdentity:
        return self._identity

    def advise(self, request: WorkRequest) -> Advisory:
        recorded = self._recording.entries.get(request.request_id)
        if recorded is None:
            raise AdvisorError("request não existe no recording")
        return recorded.to_domain()
