"""Fake determinístico que trata a intenção como dado não confiável."""

from __future__ import annotations

from decimal import Decimal

from work_intake.domain.models import (
    AdvisorIdentity,
    Advisory,
    AdvisoryCategory,
    Priority,
    Risk,
    WorkRequest,
)


class FakeAdvisor:
    @property
    def identity(self) -> AdvisorIdentity:
        return AdvisorIdentity(adapter="fake", version="1.0")

    def advise(self, request: WorkRequest) -> Advisory:
        lowered = request.intent.casefold()
        injection_markers = ("ignore previous", "exfiltrate", "bypass policy")
        if any(marker in lowered for marker in injection_markers):
            return Advisory(
                category=AdvisoryCategory.SECURITY,
                risk=Risk.HIGH,
                confidence=Decimal("1.0"),
                signals=("untrusted_instruction",),
            )
        if request.priority in {Priority.HIGH, Priority.CRITICAL}:
            return Advisory(
                category=AdvisoryCategory.OPERATIONS,
                risk=Risk.MEDIUM,
                confidence=Decimal("0.8"),
                signals=("elevated_priority",),
            )
        return Advisory(
            category=AdvisoryCategory.DELIVERY,
            risk=Risk.LOW,
            confidence=Decimal("0.9"),
            signals=("routine_delivery",),
        )
