"""Carregamento e validação de um contrato de harness independente de fornecedor."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class Integration:
    protocol: str
    revision: str
    dependency: str


@dataclass(frozen=True, slots=True)
class HarnessContract:
    objective: str
    in_scope: tuple[str, ...]
    out_of_scope: tuple[str, ...]
    capabilities: tuple[str, ...]
    stop_conditions: tuple[str, ...]
    instruction_files: tuple[str, ...]
    evidence_commands: tuple[tuple[str, ...], ...]
    allowed_command_prefixes: tuple[tuple[str, ...], ...]
    context_budget: int
    integrations: tuple[Integration, ...]

    def violations(self) -> tuple[str, ...]:
        problems: list[str] = []
        if not self.objective.strip():
            problems.append("MISSING_OBJECTIVE: informe o objetivo da tarefa")
        for field, values in (
            ("in_scope", self.in_scope),
            ("out_of_scope", self.out_of_scope),
            ("capabilities", self.capabilities),
            ("stop_conditions", self.stop_conditions),
        ):
            if not values or any(not value.strip() for value in values):
                problems.append(f"MISSING_{field.upper()}: informe valores não vazios")
        if not any(Path(name).name == "AGENTS.md" for name in self.instruction_files):
            problems.append("MISSING_PORTABLE_INSTRUCTIONS: instruction_files requer AGENTS.md")
        if not self.evidence_commands:
            problems.append("MISSING_EVIDENCE: informe pelo menos um comando verificável")
        if not self.allowed_command_prefixes:
            problems.append("MISSING_ALLOWLIST: allowed_command_prefixes não pode ser vazio")
        if self.context_budget <= 0:
            problems.append("INVALID_CONTEXT_BUDGET: context_budget deve ser positivo")

        for index, command in enumerate(self.evidence_commands):
            if not command or any(not token.strip() for token in command):
                problems.append(
                    f"INVALID_EVIDENCE_COMMAND[{index}]: use lista de argumentos não vazios"
                )
        for index, prefix in enumerate(self.allowed_command_prefixes):
            if not prefix or any(not token.strip() for token in prefix):
                problems.append(f"INVALID_COMMAND_PREFIX[{index}]: prefixo vazio")

        for integration in self.integrations:
            if not integration.protocol or not integration.revision or not integration.dependency:
                problems.append(
                    "UNVERSIONED_INTEGRATION: protocolo, revisão e dependência são obrigatórios"
                )
        return tuple(problems)


def _strings(value: Any, field: str) -> tuple[str, ...]:
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError(f"{field} deve ser uma lista de strings")
    return tuple(value)


def _commands(value: Any, field: str) -> tuple[tuple[str, ...], ...]:
    if not isinstance(value, list):
        raise ValueError(f"{field} deve ser uma lista de listas de argumentos")
    commands: list[tuple[str, ...]] = []
    for command in value:
        if not isinstance(command, list) or not all(isinstance(token, str) for token in command):
            message = f"{field} não aceita string de shell; use [executável, argumento, ...]"
            raise ValueError(message)
        commands.append(tuple(command))
    return tuple(commands)


def load_contract(path: Path) -> HarnessContract:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("a raiz do contrato deve ser um objeto JSON")

    raw_integrations = raw.get("integrations", [])
    if not isinstance(raw_integrations, list):
        raise ValueError("integrations deve ser uma lista")
    integrations: list[Integration] = []
    for item in raw_integrations:
        if not isinstance(item, dict):
            raise ValueError("cada integration deve ser um objeto")
        integrations.append(
            Integration(
                protocol=str(item.get("protocol", "")),
                revision=str(item.get("revision", "")),
                dependency=str(item.get("dependency", "")),
            )
        )

    budget = raw.get("context_budget")
    if not isinstance(budget, int) or isinstance(budget, bool):
        raise ValueError("context_budget deve ser inteiro")

    return HarnessContract(
        objective=str(raw.get("objective", "")),
        in_scope=_strings(raw.get("in_scope", []), "in_scope"),
        out_of_scope=_strings(raw.get("out_of_scope", []), "out_of_scope"),
        capabilities=_strings(raw.get("capabilities", []), "capabilities"),
        stop_conditions=_strings(raw.get("stop_conditions", []), "stop_conditions"),
        instruction_files=_strings(raw.get("instruction_files"), "instruction_files"),
        evidence_commands=_commands(raw.get("evidence_commands"), "evidence_commands"),
        allowed_command_prefixes=_commands(
            raw.get("allowed_command_prefixes"), "allowed_command_prefixes"
        ),
        context_budget=budget,
        integrations=tuple(integrations),
    )
