"""Adapters traduzem transporte; as regras permanecem no contrato canônico."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from typing import Protocol

from sdd_lab.contract import FeatureContract


@dataclass(frozen=True)
class AdapterEnvelope:
    adapter: str
    contract_fingerprint: str
    entrypoint: str


def contract_fingerprint(contract: FeatureContract) -> str:
    canonical = json.dumps(
        asdict(contract), ensure_ascii=False, sort_keys=True, separators=(",", ":")
    )
    return hashlib.sha256(canonical.encode()).hexdigest()


class ContractAdapter(Protocol):
    def render(self, contract: FeatureContract) -> AdapterEnvelope: ...


@dataclass(frozen=True)
class AgentSkillsAdapter:
    def render(self, contract: FeatureContract) -> AdapterEnvelope:
        return AdapterEnvelope("agent-skills", contract_fingerprint(contract), "skills/plan-writer")


@dataclass(frozen=True)
class GenericHarnessAdapter:
    def render(self, contract: FeatureContract) -> AdapterEnvelope:
        return AdapterEnvelope("generic-harness", contract_fingerprint(contract), "sdd_lab.check")
