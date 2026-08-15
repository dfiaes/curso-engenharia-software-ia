"""Allowlist-based telemetry export with content redaction."""

from __future__ import annotations

from dataclasses import dataclass

from m12_lab.security import ContentPolicy

type AttributeValue = str | int | float | bool


@dataclass(frozen=True, slots=True)
class SanitizedSpan:
    name: str
    attributes: dict[str, AttributeValue]


class SafeSpanExporter:
    _allowed_attributes = frozenset(
        {
            "ai.operation.name",
            "ai.model.logical_name",
            "ai.input.units",
            "ai.output.units",
            "ai.cost.amount",
            "security.policy_rule",
            "security.outcome",
            "tenant.opaque_ref",
            "tool.name",
        }
    )

    def __init__(self, content_policy: ContentPolicy) -> None:
        self._content_policy = content_policy
        self.exported: list[SanitizedSpan] = []

    def export(self, name: str, attributes: dict[str, AttributeValue]) -> SanitizedSpan:
        sanitized: dict[str, AttributeValue] = {}
        redacted_categories: set[str] = set()
        for key, value in attributes.items():
            if key not in self._allowed_attributes:
                continue
            if isinstance(value, str):
                result = self._content_policy.redact(value)
                sanitized[key] = result.text
                redacted_categories.update(result.categories)
            else:
                sanitized[key] = value
        if redacted_categories:
            sanitized["security.outcome"] = "redacted"
        span = SanitizedSpan(name=name, attributes=sanitized)
        self.exported.append(span)
        return span
