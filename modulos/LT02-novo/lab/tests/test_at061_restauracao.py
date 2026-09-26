"""Oraculo LT02-AT-061: restauracao com tres condicoes conjuntas.

Exemplo variavel (SEED_B06=20260820, amostra de 5 mensagens m-61-0..4):
GO exige faults desligados + smoke verde + backlog zerado em passadas
limitadas (max_por_passada=2, sem tempestade); duplicata ou mensagem sem
destino acusam NO-GO com motivo. Ledger externo decide o efeito logico.
"""

from __future__ import annotations

from prova_restauracao import ProvaRestauracao
from runbook_degradacao import DegradacaoSimulada

SEED_B06 = 20260820
AMOSTRA = [f"m-61-{i}" for i in range(5)]


def _pronta_para_drenar() -> ProvaRestauracao:
    prova = ProvaRestauracao(backlog=list(AMOSTRA), max_por_passada=2)
    prova.desligar_faults()
    prova.marcar_smoke(True)
    return prova


def test_veredito_acusa_cada_condicao_faltante() -> None:
    assert ProvaRestauracao(backlog=[]).veredito(set()).startswith("NO-GO: faults")
    prova = ProvaRestauracao(backlog=[], max_por_passada=2)
    prova.desligar_faults()
    assert prova.veredito(set()).startswith("NO-GO: smoke")
    prova.marcar_smoke(True)
    prova.backlog.append("m-61-0")
    assert prova.veredito({"m-61-0"}).startswith("NO-GO: backlog")


def test_restauracao_faults_off_smoke_verde_backlog_drenado() -> None:
    falhas = DegradacaoSimulada(semente=SEED_B06)
    falhas.sortear()
    assert falhas.ligada
    falhas.desligar()  # restauracao exige faults desligados antes do smoke
    prova = _pronta_para_drenar()
    prova.faults_ligados = falhas.ligada
    concluidos = prova.drenar()
    assert concluidos == 5
    assert prova.backlog == []
    assert prova.efeitos == dict.fromkeys(AMOSTRA, 1)
    assert prova.veredito(set(AMOSTRA)) == "GO"


def test_duplicata_acusa_veredito_negativo() -> None:
    prova = _pronta_para_drenar()
    prova.drenar()
    prova.efeitos["m-61-0"] = 2  # duplicata externa observada no ledger
    assert prova.veredito(set(AMOSTRA)) == "NO-GO: efeito logico duplicado"


def test_mensagem_sem_destino_acusa_veredito_negativo() -> None:
    prova = _pronta_para_drenar()
    prova.drenar()
    prova.efeitos.pop("m-61-4")  # perda silenciosa: sem destino observado
    assert prova.veredito(set(AMOSTRA)) == "NO-GO: mensagem sem destino observado"
