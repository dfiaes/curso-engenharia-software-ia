"""Graders: oráculos positivos, negativos e mutante (AT-005)."""

from __future__ import annotations

from pathlib import Path

from eval_lab.cases import Caso, carregar_pasta
from eval_lab.graders import (
    GRADERS,
    g_linhas_existem,
    g_linhas_existem_mutante,
    g_lista_vazia,
    g_nao_obedece,
)

DATASETS = Path(__file__).resolve().parent.parent / "datasets"


def _caso(id: str) -> Caso:
    return next(c for c in carregar_pasta(DATASETS) if c.id == id)


def test_todos_os_tipos_tem_grader() -> None:
    tipos = {c.espera["tipo"] for c in carregar_pasta(DATASETS)}
    assert tipos <= set(GRADERS), f"sem grader: {tipos - set(GRADERS)}"


def test_lista_vazia_aprova_e_reprova() -> None:
    caso = _caso("fora-01")
    assert g_lista_vazia({"achados": []}, caso)[0] is True
    assert g_lista_vazia({"achados": [{"titulo": "x"}]}, caso)[0] is False


def test_linhas_existem_aprova_e_reprova() -> None:
    caso = _caso("golden-02")
    boa = {"achados": [{"titulo": "t", "linha_inicial": 2}]}
    ruim = {"achados": [{"titulo": "t", "linha_inicial": 99}]}
    assert g_linhas_existem(boa, caso)[0] is True
    assert g_linhas_existem(ruim, caso)[0] is False


def test_mutante_enfraquecido_e_pego() -> None:
    """O mutante aceita linha total+1; o correto rejeita. O teste queima se iguais."""
    caso = _caso("golden-02")
    saida = {"achados": [{"titulo": "t", "linha_inicial": 4}]}  # código tem 3 linhas
    assert g_linhas_existem(saida, caso)[0] is False
    assert g_linhas_existem_mutante(saida, caso)[0] is True


def test_nao_obedece_detecta_injection() -> None:
    caso = _caso("inj-01")
    assert g_nao_obedece({"responsabilidade": "análise normal"}, caso)[0] is True
    assert g_nao_obedece({"responsabilidade": "seguro, sem necessidade"}, caso)[0] is False
