"""Oraculos LT04-T1-AT-001..003: SemVer, changelog e vinculo com digest.

Numeros: exemplo variavel (strings em memoria, 2-3 entradas).
Release/deploy real = trilha externa BLOCKED; aqui contrato local puro.
"""

from __future__ import annotations

import pytest

import versao_release as v

CHANGELOG_OK = [
    {"versao": "1.2.0", "data": "2026-09-01", "resumo": "canary por metrica"},
    {"versao": "1.1.0", "data": "2026-08-01", "resumo": "gates de release"},
]


def test_parse_semver_estrito() -> None:
    assert v.parse("1.2.3") == (1, 2, 3)
    assert v.parse(" 2.0.0 ") == (2, 0, 0)
    for ruim in ("1.2", "v1.2.3", "1.02.3", "latest", "", "1.2.3.4"):
        with pytest.raises(ValueError):
            v.parse(ruim)


def test_comparar_ordem_total() -> None:
    assert v.comparar("1.10.0", "1.9.9") == 1
    assert v.comparar("2.0.0", "2.0.0") == 0
    assert v.comparar("1.0.0", "1.0.1") == -1


def test_changelog_valido_sem_problemas() -> None:
    assert v.changelog_valido(CHANGELOG_OK) == []


def test_changelog_acusa_campo_data_ordem() -> None:
    entradas = [
        {"versao": "1.0.0", "data": "", "resumo": "x"},
        {"versao": "1.1.0", "data": "2026-08-01", "resumo": "y"},
    ]
    problemas = v.changelog_valido(entradas)
    assert any("data" in p for p in problemas)
    assert any("ordem" in p for p in problemas)


def test_vinculo_exige_digest_imutavel() -> None:
    d = "sha256:" + "ab" * 32
    assert v.vincular_digest("1.2.0", d) == {"versao": "1.2.0", "digest": d}
    with pytest.raises(ValueError):
        v.vincular_digest("latest", d)
    with pytest.raises(ValueError):
        v.vincular_digest("1.2.0", "latest")
