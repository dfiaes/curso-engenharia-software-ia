"""Oraculos LT03-AT-030/031/032: plan converge, drift decide, import/move sem recriar.

Numeros: exemplo variavel (dicionarios em memoria, 2-3 enderecos).
Sem binario IaC: plano como diff de dados; segundo plan vazio apos apply.
"""

from __future__ import annotations

import estado_iac as i

DESEJADO = {"rede.lab": "v1", "banco.lab": "v1"}
OBSERVADO_IGUAL = {"rede.lab": "v1", "banco.lab": "v1"}


def test_plan_vazio_quando_nada_mudou() -> None:
    resultado = i.plano(DESEJADO, OBSERVADO_IGUAL)
    assert i.vazio(resultado) is True


def test_segundo_plan_vazio_apos_apply() -> None:
    observado = {"rede.lab": "v0", "extra.lab": "v1"}
    novo = i.aplicar(DESEJADO, observado)
    assert novo == DESEJADO
    assert i.vazio(i.plano(DESEJADO, novo)) is True


def test_drift_detectado_e_decidido_com_registro() -> None:
    real = {"rede.lab": "v1", "banco.lab": "manual-v9"}
    assert i.detectar_drift(DESEJADO, real) == ["banco.lab"]


def test_import_adota_sem_recriar() -> None:
    estado = i.importar({}, "banco.lab", "id-preexistente")
    assert estado == {"banco.lab": "id-preexistente"}


def test_move_reendereca_sem_recriar() -> None:
    estado = i.mover({"rede.antiga": "v1"}, "rede.antiga", "rede.nova")
    assert estado == {"rede.nova": "v1"}
