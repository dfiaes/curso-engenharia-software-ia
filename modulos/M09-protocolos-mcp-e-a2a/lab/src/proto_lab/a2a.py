"""A2A local: cards, tasks e opacidade entre pares (lote M09).

Agente↔agente com ciclo de vida e identidade: o cliente descobre pelo
card, abre task, acompanha por polling e coleta artifacts. O interior
(ferramentas, prompt, modelo) nunca atravessa — opacidade deliberada.
"""

from __future__ import annotations

import itertools
from dataclasses import dataclass, field
from typing import Any, Literal

EstadoTask = Literal[
    "WORKING", "INPUT_REQUIRED", "AUTH_REQUIRED", "COMPLETED", "FAILED", "CANCELED", "REJECTED"
]


@dataclass(frozen=True, slots=True)
class AgentCard:
    name: str
    description: str
    url: str
    version: str
    skills: tuple[dict[str, Any], ...] = ()
    capabilities: frozenset[str] = frozenset()

    def to_dict(self) -> dict[str, Any]:
        """Documento de descoberta: identidade e skills, nunca o interior."""
        return {
            "protocolVersion": "1.0",
            "name": self.name,
            "description": self.description,
            "url": self.url,
            "version": self.version,
            "capabilities": sorted(self.capabilities),
            "skills": list(self.skills),
        }


@dataclass(slots=True)
class Task:
    id: str
    estado: EstadoTask = "WORKING"
    mensagens: list[dict[str, Any]] = field(default_factory=list)
    artifacts: list[dict[str, Any]] = field(default_factory=list)
    motivo: str = ""


class AgentA2A:
    """Agente com roteiro de skills e ciclo de vida de task."""

    def __init__(self, card: AgentCard, escopos: frozenset[str] = frozenset({"analise"})) -> None:
        self.card = card
        self._escopos = escopos
        self._tasks: dict[str, Task] = {}
        self._ids = itertools.count(1)

    def descobrir(self) -> dict[str, Any]:
        """Card público: o que faz e como falar, sem o interior."""
        return self.card.to_dict()

    def abrir_task(self, mensagem: str, skill: str = "analise-de-impacto") -> Task:
        """Abre task; skill fora do escopo é REJECTED na hora."""
        task = Task(id=f"task-{next(self._ids):04d}")
        if skill not in self._escopos and skill not in {s.get("id") for s in self.card.skills}:
            task.estado = "REJECTED"
            task.motivo = f"skill fora de escopo: {skill}"
        else:
            task.estado = "WORKING"
            task.mensagens.append({"role": "user", "content": mensagem})
        self._tasks[task.id] = task
        return task

    def consultar(self, task_id: str) -> Task:
        """Polling: devolve o estado atual (default seguro)."""
        return self._tasks[task_id]

    def responder(self, task_id: str, mensagem: str) -> Task:
        """Continua task em INPUT_REQUIRED; fora disso, ignora com motivo."""
        task = self._tasks[task_id]
        if task.estado != "INPUT_REQUIRED":
            return task
        task.mensagens.append({"role": "user", "content": mensagem})
        task.estado = "COMPLETED"
        task.artifacts.append({"tipo": "relatorio", "resumo": f"concluído com: {mensagem[:60]}"})
        return task

    def concluir(self, task_id: str, artifact: dict[str, Any]) -> Task:
        """Finaliza com artifact (opacidade: só o entregável atravessa)."""
        task = self._tasks[task_id]
        task.estado = "COMPLETED"
        task.artifacts.append(artifact)
        return task

    def pedir_entrada(self, task_id: str, motivo: str) -> Task:
        """Transita para INPUT_REQUIRED com o motivo registrado."""
        task = self._tasks[task_id]
        task.estado = "INPUT_REQUIRED"
        task.motivo = motivo
        return task

    def cancelar(self, task_id: str) -> Task:
        """Cancela: estado final, sem efeito colateral pendente."""
        task = self._tasks[task_id]
        task.estado = "CANCELED"
        return task
