"""A2A: card, ciclo de vida, recusa e opacidade (AT-013/014)."""

from __future__ import annotations

from proto_lab.a2a import AgentA2A, AgentCard


def _agente() -> AgentA2A:
    card = AgentCard(
        name="Demo",
        description="Agente de demonstração.",
        url="http://127.0.0.1/a2a",
        version="0.1.0",
        skills=({"id": "analise-de-impacto", "description": "Impacto de mudança."},),
    )
    return AgentA2A(card)


def test_descoberta_expõe_card_sem_interior() -> None:
    card = _agente().descobrir()
    assert card["name"] == "Demo" and card["protocolVersion"] == "1.0"
    assert "analise-de-impacto" in str(card["skills"])
    corpo = str(card).lower()
    assert "tools" not in card and "modelo" not in corpo and "prompt" not in corpo


def test_ciclo_ate_completed() -> None:
    agente = _agente()
    task = agente.abrir_task("o que quebra se eu mudar X?")
    assert task.estado == "WORKING"
    agente.pedir_entrada(task.id, "falta o repositório")
    assert agente.consultar(task.id).estado == "INPUT_REQUIRED"
    final = agente.responder(task.id, "repo: demo")
    assert final.estado == "COMPLETED"
    assert final.artifacts and "demo" in str(final.artifacts)


def test_rejeita_fora_de_escopo() -> None:
    agente = _agente()
    task = agente.abrir_task("preveja a bolsa", skill="oraculo-financeiro")
    assert task.estado == "REJECTED"
    assert "oraculo-financeiro" in task.motivo


def test_cancela_sem_efeito() -> None:
    agente = _agente()
    task = agente.abrir_task("algo longo")
    assert agente.cancelar(task.id).estado == "CANCELED"
