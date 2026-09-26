"""B19: piloto BLOCKED estruturalmente; kit e scorecard prontos; consentimento obrigatório."""

import pytest

from capstone_lab.pilot import (
    DEFAULT_KIT,
    PilotBlocked,
    PilotLog,
    PilotSession,
    decision_statement,
)


def test_blocked_estrutural_sem_humano() -> None:
    log = PilotLog()
    with pytest.raises(PilotBlocked, match="BLOCKED"):
        log.validacao()
    decisao = decision_statement(log)
    assert decisao.startswith("BLOCKED")
    assert "consentida" in decisao


def test_kit_recrutamento_pronto_e_validavel() -> None:
    assert DEFAULT_KIT.validar() == []  # kit completo, sem pendências
    assert len(DEFAULT_KIT.roteiro_observacao) >= 4
    assert len(DEFAULT_KIT.consentimento_texto) > 120


def test_kit_incompleto_e_denunciado() -> None:
    kit_ruim = type(DEFAULT_KIT)(
        roteiro_observacao=("só um passo",),
        consentimento_texto="ok",
        canais=(),
        recompensa="nada",
        criterios=(),
    )
    problemas = kit_ruim.validar()
    assert len(problemas) == 3


def test_sessao_sem_consentimento_e_recusada() -> None:
    log = PilotLog()
    sessao = PilotSession(
        participante_id="p-001",
        consentimento=False,
        tarefa_real="explicar módulo",
        baseline_min=30.0,
        produto_min=12.0,
        erros_produto=1,
        confianca_pos=4,
        repetir=True,
        pagar=False,
    )
    with pytest.raises(ValueError, match="consentimento"):
        log.registrar(sessao)


def test_validacao_com_sessao_hipotetica_marca_decisao() -> None:
    """Mecanismo do scorecard exercitado com dados rotulados de exemplo.

    Não é validação do problema (deixa de ser BLOCKED apenas com humano real);
    prova apenas que a matemática do scorecard está correta para quando houver.
    """
    log = PilotLog(rotulo="exemplo-didatico-nao-humano")
    log.registrar(
        PilotSession(
            "p-000",
            True,
            "tarefa",
            baseline_min=30.0,
            produto_min=15.0,
            erros_produto=0,
            confianca_pos=5,
            repetir=True,
            pagar=True,
        )
    )
    log.registrar(
        PilotSession(
            "p-001",
            True,
            "tarefa",
            baseline_min=40.0,
            produto_min=35.0,
            erros_produto=2,
            confianca_pos=3,
            repetir=True,
            pagar=False,
        )
    )
    rel = log.validacao()
    assert rel["n"] == 2 and rel["ganho_medio_min"] == 10.0
    assert rel["hipotese"] == "apoiada"  # mecanismo, não conclusão de produto


def test_decisao_statement_reflete_estado_real() -> None:
    assert decision_statement(PilotLog()) == (
        "BLOCKED: sem sessão humana real consentida; validação estruturalmente impossível"
    )
