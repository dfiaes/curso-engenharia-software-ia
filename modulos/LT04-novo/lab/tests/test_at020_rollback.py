"""Oraculos LT04-T1-AT-020..022: stop, rollback ao anterior e restore provado.

Numeros: exemplo variavel (dicts em memoria, 2 releases, 2 metricas).
Trafego e dado reais = trilha externa BLOCKED; aqui decisao sobre dados.
"""

from __future__ import annotations

import pytest

import rollback_release as r

HIST = [
    {"versao": "1.1.0", "digest": "sha256:" + "aa" * 32, "dado": "esquema-3"},
    {"versao": "1.2.0", "digest": "sha256:" + "bb" * 32, "dado": "esquema-4"},
]


def test_stop_lista_violacoes_em_ordem() -> None:
    v = r.stop_disparado({"erro": 0.09, "p99": 900.0}, {"erro": 0.05, "p99": 800.0})
    assert v == ["erro", "p99"]
    assert r.stop_disparado({"erro": 0.01}, {"erro": 0.05}) == []


def test_sem_stop_mantem_atual() -> None:
    d: dict[str, object] = r.reverter(HIST, 1, [])
    assert d == {"acao": "manter", "alvo": HIST[1]}


def test_stop_disparado_reverte_ao_anterior() -> None:
    d = r.reverter(HIST, 1, ["erro"])
    assert d == {"acao": "rollback", "alvo": HIST[0]}


def test_rollback_sem_anterior_e_erro_explicito() -> None:
    with pytest.raises(ValueError):
        r.reverter(HIST, 0, ["erro"])


def test_restore_exige_digest_dado_e_saude() -> None:
    alvo = HIST[0]
    ok: dict[str, object] = {"digest": alvo["digest"], "dado": "esquema-3", "saudavel": True}
    assert r.restauracao_ok(alvo, ok) is True
    for ruim in (
        {"digest": "outro", "dado": "esquema-3", "saudavel": True},
        {"digest": alvo["digest"], "dado": "esquema-4", "saudavel": True},
        {"digest": alvo["digest"], "dado": "esquema-3", "saudavel": False},
    ):
        estado: dict[str, object] = dict(ruim)
        assert r.restauracao_ok(alvo, estado) is False
