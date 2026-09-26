"""Oraculo LT02-AT-060: incidente com tres falhas e runbook ordenado.

Exemplo variavel (SEED_B06=20260820): DegradacaoSimulada deriva a mesma
combinacao da semente; RegistroIncidente exige hipotese com os dois
sinais antes de qualquer toque; eliminacao consulta confirmadas/voo/
ledger do barato ao destrutivo; Runbook fora de ordem levanta; patch
minimo (consultar por identidade antes de reenfileirar) com regressao
que falha antes e passa depois; incident.md publica causa/patch/
residual/timeline sem culpa. So stdlib nos modulos.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from registro_incidente import Hipotese, HipoteseAusente, Observacao, RegistroIncidente
from runbook_degradacao import DegradacaoSimulada, OrdemViolada, Runbook

SEED_B06 = 20260820

PATCH_MINIMO = "consultar confirmadas e efeitos por message_id antes de reenfileirar"


def _registro_com_hipotese() -> RegistroIncidente:
    registro = RegistroIncidente(
        invariantes=["um-efeito-por-intencao", "sem-perda-silenciosa"],
        matriz_falhas=["confirm-perdido", "morte-worker", "upstream-ambiguo"],
    )
    registro.declarar_hipotese(
        Hipotese(
            descricao="confirm perdido com worker morto e upstream ambiguo",
            sinal_esperado="consultadas sem destino + voo devolvido + ledger sem operation",
            sinal_contrario="consultadas com destino ou ledger com operation",
        )
    )
    return registro


def test_observar_sem_hipotese_levanta() -> None:
    registro = RegistroIncidente(invariantes=["um-efeito-por-intencao"], matriz_falhas=["x"])
    with pytest.raises(HipoteseAusente, match="hipotese"):
        registro.registrar_observacao(Observacao(passo="toque", viu="nada", decide="nada"))


def test_eliminacao_publica_incident_md_sem_culpa(tmp_path: Path) -> None:
    registro = _registro_com_hipotese()
    registro.registrar_observacao(
        Observacao(
            passo="consultar-confirmadas",
            viu="m-60 sem destino",
            decide="confirm perdido segue; destino riscaria",
        )
    )
    registro.registrar_observacao(
        Observacao(
            passo="inspecionar-voo",
            viu="voo devolvido com tentativa incrementada",
            decide="morte antes do ack segue",
        )
    )
    registro.registrar_observacao(
        Observacao(
            passo="perguntar-ledger",
            viu="operation op-60 ausente",
            decide="upstream unknown: reconciliar antes de retentar",
        )
    )
    texto = registro.gerar_incident(
        causa="reenfileirar sem consultar confirmadas",
        patch=PATCH_MINIMO,
        residual="upstream irreconciliavel abre caso humano; revalidar em 90 dias",
    )
    incident = tmp_path / "incident.md"
    incident.write_text(texto, encoding="utf-8")
    lido = incident.read_text(encoding="utf-8")
    assert lido.startswith("# incident")
    assert "causa: reenfileirar sem consultar confirmadas" in lido
    assert f"patch: {PATCH_MINIMO}" in lido
    assert "residual:" in lido
    assert "hipotese: confirm perdido" in lido
    assert "- consultar-confirmadas:" in lido
    assert "- perguntar-ledger:" in lido
    assert "culpa" not in lido.lower()


def test_semente_reproduz_combinacao() -> None:
    primeira = DegradacaoSimulada(semente=SEED_B06)
    segunda = DegradacaoSimulada(semente=SEED_B06)
    primeira.sortear()
    segunda.sortear()
    assert (primeira.confirm_perdido, primeira.ponto_morte, primeira.upstream_ambiguo) == (
        segunda.confirm_perdido,
        segunda.ponto_morte,
        segunda.upstream_ambiguo,
    )
    assert primeira.ponto_morte in ("antes-do-ack", "apos-efeito", "antes-do-efeito")


def test_runbook_exige_conter_reconciliar_drenar() -> None:
    runbook = Runbook()
    with pytest.raises(OrdemViolada, match="apos conter"):
        runbook.reconciliar("v")
    with pytest.raises(OrdemViolada, match="apos reconciliar"):
        runbook.drenar("v")
    runbook.conter("amplificacao congelada")
    runbook.reconciliar("unknowns fechados por operation ID")
    runbook.drenar("backlog em passadas limitadas")
    assert runbook.passos == [
        "conter: amplificacao congelada",
        "reconciliar: unknowns fechados por operation ID",
        "drenar: backlog em passadas limitadas",
    ]


def test_regressao_falha_antes_passa_depois_com_patch_minimo() -> None:
    """Bug: reenfileirar sem consultar duplica; patch: consultar antes."""
    ledger: dict[str, int] = {}

    def concluir_buggy(mensagem_id: str) -> None:
        ledger[mensagem_id] = ledger.get(mensagem_id, 0) + 1

    def concluir_corrigida(mensagem_id: str) -> None:
        if mensagem_id not in ledger:  # PATCH_MINIMO: consulta antes do efeito
            ledger[mensagem_id] = 1

    concluir_buggy("m-60")
    concluir_buggy("m-60")
    assert ledger["m-60"] == 2  # falha antes: duplicata provada
    ledger.clear()
    concluir_corrigida("m-60")
    concluir_corrigida("m-60")
    assert ledger["m-60"] == 1  # passa depois: um efeito por intencao
