"""Evidence-derived decisions; no caller may provide a manual PASS flag."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class Decision(StrEnum):
    PASS = "PASS"  # noqa: S105 - release decision, not a password
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"


class CheckResult(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    evidence_id: str = Field(pattern=r"^EV-[A-Z]{2,4}-\d{3}$")
    command: str = Field(min_length=1)
    exit_code: int | None
    required: bool = True
    blocker: str | None = None

    @property
    def decision(self) -> Decision:
        if self.exit_code is None:
            return Decision.BLOCKED
        return Decision.PASS if self.exit_code == 0 else Decision.FAIL


def evaluate_checks(checks: tuple[CheckResult, ...]) -> Decision:
    required = tuple(item for item in checks if item.required)
    if not required:
        return Decision.BLOCKED
    if any(item.decision is Decision.FAIL for item in required):
        return Decision.FAIL
    if any(item.decision is Decision.BLOCKED for item in required):
        return Decision.BLOCKED
    return Decision.PASS
