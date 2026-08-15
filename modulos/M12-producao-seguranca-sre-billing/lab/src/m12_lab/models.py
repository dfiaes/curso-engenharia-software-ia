"""Stable domain contracts shared by the M12 adapters."""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


def utc_now() -> datetime:
    return datetime.now(UTC)


def canonical_json(value: BaseModel | dict[str, Any]) -> bytes:
    payload = value.model_dump(mode="json") if isinstance(value, BaseModel) else value
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(value: BaseModel | dict[str, Any]) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class Principal(StrictModel):
    actor_id: UUID
    tenant_id: UUID
    scopes: frozenset[str] = Field(default_factory=frozenset)
    workload_id: str = Field(min_length=1, max_length=120)


class ToolRequest(StrictModel):
    request_id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    tool_name: str = Field(pattern=r"^[a-z][a-z0-9_]{1,63}$")
    arguments: dict[str, Any]
    requested_at: datetime = Field(default_factory=utc_now)

    @field_validator("requested_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("requested_at must be timezone-aware")
        return value

    @property
    def intent_hash(self) -> str:
        return digest(
            {"tenant_id": str(self.tenant_id), "tool": self.tool_name, "args": self.arguments}
        )


class AuditEvent(StrictModel):
    event_id: UUID = Field(default_factory=uuid4)
    event_type: str
    actor_id: UUID | None
    tenant_id: UUID
    correlation_id: UUID
    rule_id: str | None = None
    outcome: str
    occurred_at: datetime = Field(default_factory=utc_now)
    metadata: dict[str, str] = Field(default_factory=dict)
