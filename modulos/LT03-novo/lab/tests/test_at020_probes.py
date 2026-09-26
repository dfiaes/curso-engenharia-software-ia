"""Oraculo LT03-AT-020: cada probe produz somente a reacao pretendida.

Numeros: exemplo variavel (dicts em memoria). Sem cluster: reacoes como dados,
liveness com dependencia externa acusada como defeito catalogado.
"""

from __future__ import annotations

import sinais_escala as s


def test_reacoes_contratadas_uma_nao_substitui_a_outra() -> None:
    assert s.reacao("inicializacao") == "suspende-as-demais"
    assert s.reacao("prontidao") == "remove-dos-endpoints"
    assert s.reacao("vivacidade") == "reinicia-container"


def test_tipo_desconhecido_e_defeito() -> None:
    assert s.reacao("sondagem") == "tipo-desconhecido"


def test_vivacidade_com_dependencia_externa_e_defeito() -> None:
    assert s.vivacidade_segura(False) is True
    assert s.vivacidade_segura(True) is False


def test_prontidao_remove_sem_reiniciar() -> None:
    assert s.reacao("prontidao") != s.reacao("vivacidade")
