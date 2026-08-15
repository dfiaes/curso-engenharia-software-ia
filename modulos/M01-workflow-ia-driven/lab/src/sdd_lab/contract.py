"""Contrato tipado: estrutura primeiro, decisão humana onde há ambiguidade."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

_VAGUE_TERMS = re.compile(
    r"\b(rápid[oa]|melhor|adequad[oa]|intuitiv[oa]|robust[oa]|etc\.?|user[- ]friendly)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Requirement:
    id: str
    statement: str
    verification: str
    examples: tuple[str, ...]
    counterexamples: tuple[str, ...]


@dataclass(frozen=True)
class TaskContract:
    id: str
    requirement_ids: tuple[str, ...]
    read_set: tuple[str, ...]
    write_set: tuple[str, ...]
    argv: tuple[str, ...]


@dataclass(frozen=True)
class FeatureContract:
    schema_version: str
    feature_id: str
    outcome: str
    non_goals: tuple[str, ...]
    requirements: tuple[Requirement, ...]
    tasks: tuple[TaskContract, ...]
    gates: tuple[tuple[str, ...], ...]


@dataclass(frozen=True)
class ContractIssue:
    code: str
    location: str
    message: str


@dataclass(frozen=True)
class ValidationResult:
    contract: FeatureContract | None
    issues: tuple[ContractIssue, ...]

    @property
    def ok(self) -> bool:
        return self.contract is not None and not self.issues


def _strings(value: Any, location: str, issues: list[ContractIssue]) -> tuple[str, ...]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        issues.append(ContractIssue("invalid_list", location, "esperada lista de strings"))
        return ()
    return tuple(value)


def _safe_relative(path: str) -> bool:
    candidate = PurePosixPath(path.replace("\\", "/"))
    return bool(path) and not candidate.is_absolute() and ".." not in candidate.parts


def _argv(value: Any, location: str, issues: list[ContractIssue]) -> tuple[str, ...]:
    if isinstance(value, str):
        issues.append(
            ContractIssue(
                "shell_string",
                location,
                "comando deve ser argv tokenizado; string de shell foi recusada",
            )
        )
        return ()
    result = _strings(value, location, issues)
    if not result or any(not token for token in result):
        issues.append(ContractIssue("empty_argv", location, "argv precisa de tokens não vazios"))
    return result


def validate_contract(data: object) -> ValidationResult:
    """Valida estrutura e invariantes curriculares sem corrigir entrada silenciosamente."""
    issues: list[ContractIssue] = []
    if not isinstance(data, dict):
        return ValidationResult(None, (ContractIssue("invalid_root", "$", "objeto JSON esperado"),))

    feature_id = data.get("feature_id")
    schema_version = data.get("schema_version")
    outcome = data.get("outcome")
    if schema_version != "1.0":
        issues.append(
            ContractIssue("unsupported_schema_version", "schema_version", "versão suportada: 1.0")
        )
        schema_version = ""
    if not isinstance(feature_id, str) or not re.fullmatch(r"[A-Z0-9]+-[0-9]{3}", feature_id):
        issues.append(ContractIssue("invalid_id", "feature_id", "use formato AREA-001"))
        feature_id = ""
    if not isinstance(outcome, str) or not outcome.strip():
        issues.append(
            ContractIssue("missing_outcome", "outcome", "resultado observável obrigatório")
        )
        outcome = ""

    non_goals = _strings(data.get("non_goals"), "non_goals", issues)
    if not non_goals:
        issues.append(
            ContractIssue("missing_non_goals", "non_goals", "declare ao menos um não-objetivo")
        )

    raw_requirements = data.get("requirements")
    requirements: list[Requirement] = []
    if not isinstance(raw_requirements, list) or not raw_requirements:
        issues.append(
            ContractIssue("missing_requirements", "requirements", "lista não vazia obrigatória")
        )
        raw_requirements = []
    for index, raw in enumerate(raw_requirements):
        location = f"requirements[{index}]"
        if not isinstance(raw, dict):
            issues.append(ContractIssue("invalid_requirement", location, "objeto esperado"))
            continue
        req_id = raw.get("id")
        statement = raw.get("statement")
        verification = raw.get("verification")
        if not isinstance(req_id, str) or not re.fullmatch(r"R[FN]-[0-9]{3}", req_id):
            issues.append(
                ContractIssue("invalid_requirement_id", f"{location}.id", "use RF-001 ou RN-001")
            )
            req_id = ""
        if not isinstance(statement, str) or not statement.strip():
            issues.append(
                ContractIssue("missing_statement", f"{location}.statement", "texto obrigatório")
            )
            statement = ""
        elif _VAGUE_TERMS.search(statement):
            issues.append(
                ContractIssue(
                    "vague_requirement",
                    f"{location}.statement",
                    "substitua adjetivo vago por limiar, exemplo ou propriedade verificável",
                )
            )
        if not isinstance(verification, str) or not verification.strip():
            issues.append(
                ContractIssue(
                    "missing_verification", f"{location}.verification", "oráculo obrigatório"
                )
            )
            verification = ""
        examples = _strings(raw.get("examples"), f"{location}.examples", issues)
        counterexamples = _strings(
            raw.get("counterexamples"), f"{location}.counterexamples", issues
        )
        if not examples or not counterexamples:
            issues.append(
                ContractIssue("missing_examples", location, "inclua exemplo e contraexemplo")
            )
        requirements.append(Requirement(req_id, statement, verification, examples, counterexamples))

    raw_tasks = data.get("tasks")
    tasks: list[TaskContract] = []
    if not isinstance(raw_tasks, list) or not raw_tasks:
        issues.append(ContractIssue("missing_tasks", "tasks", "lista não vazia obrigatória"))
        raw_tasks = []
    for index, raw in enumerate(raw_tasks):
        location = f"tasks[{index}]"
        if not isinstance(raw, dict):
            issues.append(ContractIssue("invalid_task", location, "objeto esperado"))
            continue
        task_id = raw.get("id")
        if not isinstance(task_id, str) or not re.fullmatch(r"T-[0-9]{3}", task_id):
            issues.append(ContractIssue("invalid_task_id", f"{location}.id", "use T-001"))
            task_id = ""
        requirement_ids = _strings(
            raw.get("requirement_ids"), f"{location}.requirement_ids", issues
        )
        read_set = _strings(raw.get("read_set"), f"{location}.read_set", issues)
        write_set = _strings(raw.get("write_set"), f"{location}.write_set", issues)
        for field, paths in (("read_set", read_set), ("write_set", write_set)):
            for path in paths:
                if not _safe_relative(path):
                    issues.append(
                        ContractIssue(
                            "unsafe_path", f"{location}.{field}", f"path fora do workspace: {path}"
                        )
                    )
        argv = _argv(raw.get("argv"), f"{location}.argv", issues)
        tasks.append(TaskContract(task_id, requirement_ids, read_set, write_set, argv))

    known_ids = {requirement.id for requirement in requirements if requirement.id}
    covered_ids = {req_id for task in tasks for req_id in task.requirement_ids}
    for missing in sorted(known_ids - covered_ids):
        issues.append(
            ContractIssue("untraced_requirement", "tasks", f"{missing} não está ligado a tarefa")
        )
    for unknown in sorted(covered_ids - known_ids):
        issues.append(
            ContractIssue("unknown_requirement", "tasks", f"referência inexistente: {unknown}")
        )

    raw_gates = data.get("gates")
    gates: list[tuple[str, ...]] = []
    if not isinstance(raw_gates, list) or not raw_gates:
        issues.append(ContractIssue("missing_gates", "gates", "declare ao menos um gate"))
        raw_gates = []
    for index, raw in enumerate(raw_gates):
        gates.append(_argv(raw, f"gates[{index}]", issues))

    contract = FeatureContract(
        schema_version,
        feature_id,
        outcome,
        non_goals,
        tuple(requirements),
        tuple(tasks),
        tuple(gates),
    )
    return ValidationResult(contract if not issues else None, tuple(issues))


def load_contract(path: Path) -> ValidationResult:
    try:
        data: object = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return ValidationResult(None, (ContractIssue("invalid_json", str(path), str(exc)),))
    return validate_contract(data)
