"""Policy mínima: path, capabilities e comandos são validados fora do modelo."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path


class Capability(StrEnum):
    READ = "read"
    WRITE = "write"
    PROCESS = "process"
    NETWORK = "network"


@dataclass(frozen=True, slots=True)
class TaskRequest:
    capabilities: frozenset[Capability]
    trusted_input: bool
    target_path: Path | None = None
    command: tuple[str, ...] | None = None


@dataclass(frozen=True, slots=True)
class Decision:
    allowed: bool
    code: str
    reason: str


def _within(path: Path, workspace: Path) -> bool:
    return path.resolve(strict=False).is_relative_to(workspace.resolve(strict=False))


def _command_allowed(command: tuple[str, ...], prefixes: tuple[tuple[str, ...], ...]) -> bool:
    return any(command[: len(prefix)] == prefix for prefix in prefixes)


def evaluate(
    request: TaskRequest,
    *,
    workspace: Path,
    allowed_command_prefixes: tuple[tuple[str, ...], ...],
) -> Decision:
    dangerous_for_untrusted = {Capability.WRITE, Capability.PROCESS, Capability.NETWORK}
    if not request.trusted_input and request.capabilities.intersection(dangerous_for_untrusted):
        return Decision(
            False,
            "DENY_UNTRUSTED_CAPABILITY",
            "conteúdo não confiável recebe somente capacidade de leitura",
        )

    if request.target_path is not None and not _within(request.target_path, workspace):
        return Decision(False, "DENY_PATH_ESCAPE", "alvo resolve fora do workspace")

    if request.command is not None:
        if Capability.PROCESS not in request.capabilities:
            return Decision(False, "DENY_PROCESS_CAPABILITY", "comando exige capability process")
        if not _command_allowed(request.command, allowed_command_prefixes):
            return Decision(False, "DENY_COMMAND", "comando não corresponde à allowlist")

    if request.capabilities == frozenset({Capability.READ}):
        return Decision(True, "ALLOW_READ", "leitura limitada ao workspace")
    return Decision(True, "ALLOW", "requisição satisfaz a policy declarada")

