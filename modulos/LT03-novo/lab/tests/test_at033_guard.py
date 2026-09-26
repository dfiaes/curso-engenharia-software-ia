"""Oraculos LT03-AT-033/034: state sem segredo em evidencia; destroy com guarda.

Numeros: exemplo variavel (dicts em memoria). Sem backend real: acesso minimo
e recusa antes da mutacao verificados como dados locais.
"""

from __future__ import annotations

import estado_iac as i


def test_segredo_em_state_e_acusado() -> None:
    assert i.contem_segredo({"banco.lab": "v1"}) is False
    assert i.contem_segredo({"db_password": "v1"}) is True
    assert i.contem_segredo({"banco.lab": "token-abc"}) is True


def test_destroy_no_sandbox_autorizado_passa() -> None:
    assert i.destruir_permitido("course-lt03") is True


def test_destroy_fora_do_sandbox_e_recusado_antes_da_acao() -> None:
    assert i.destruir_permitido("producao") is False
    assert i.destruir_permitido("") is False
