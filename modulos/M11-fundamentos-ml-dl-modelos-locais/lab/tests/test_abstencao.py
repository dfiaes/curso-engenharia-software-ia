"""Oraculo AT-019: rubrica +1/+0.5/-1 derruba o chutador no antes/depois.

Fixtures locais e rotuladas em fixtures/abstencao.json (3 ABSTENCAO +
2 respondiveis). Honesto responde certo ou abstem-se; chutador inventa
nos casos sem resposta. A soma decide: honestidade vence.
"""

import json
from pathlib import Path

from abstencao import NOTA, Desfecho, graduar

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "abstencao.json"


def _casos() -> list[dict[str, str]]:
    casos: list[dict[str, str]] = json.loads(FIXTURES.read_text(encoding="utf-8"))
    return casos


def test_rubrica_assimetrica_vale_mais_que_chute() -> None:
    """AT-019: valores da rubrica com margem exata."""
    assert NOTA[Desfecho.RESPONDEU_CERTO] == 1.0
    assert NOTA[Desfecho.ABSTEVE] == 0.5
    assert NOTA[Desfecho.RESPONDEU_ERRADO] == -1.0
    assert NOTA[Desfecho.RESPONDEU_ERRADO] < NOTA[Desfecho.ABSTEVE] < NOTA[Desfecho.RESPONDEU_CERTO]


def test_graduar_casos_sem_resposta() -> None:
    """AT-019: abster-se no abst-001/002/005 rende +0.5 cada."""
    for caso in _casos():
        if caso["esperado"] == "ABSTENCAO":
            desfecho, nota = graduar(caso["esperado"], "ABSTENCAO")
            assert desfecho == Desfecho.ABSTEVE
            assert nota == 0.5


def test_graduar_resposta_errada_pune() -> None:
    """AT-019 negativo: inventar SLA rende -1.0, pior que abster-se."""
    desfecho, nota = graduar("ABSTENCAO", "24 horas")
    assert desfecho == Desfecho.RESPONDEU_ERRADO
    assert nota == -1.0


def test_honesto_vence_chutador_no_antes_depois() -> None:
    """AT-019 antes/depois: honestidade soma mais que chute nos 5 casos."""
    casos = _casos()
    # Fronteira honesta: o conjunto do contrato usa "nao esta no contexto"
    # sem acento; "não está no contexto" acentuado NÃO pertence ao conjunto
    # e seria pontuado como erro. Normalização aqui é minúscula+espaço só.
    honestas = {"abst-001": "ABSTENCAO", "abst-002": "nao esta no contexto"}
    total_honesto = 0.0
    total_chutador = 0.0
    for caso in casos:
        esperado = caso["esperado"]
        obtido_honesto = honestas.get(caso["id"], esperado)
        _, nota_h = graduar(esperado, obtido_honesto)
        _, nota_c = graduar(esperado, "chute inventado")
        total_honesto += nota_h
        total_chutador += nota_c
    assert total_honesto > total_chutador
    assert total_honesto == 3.5  # 3x0.5 + 2x1.0
    assert total_chutador == -5.0  # 5x-1.0: chutar tudo perde em todo caso
