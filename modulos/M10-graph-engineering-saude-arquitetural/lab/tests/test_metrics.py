"""Métricas, memória temporal e as 3 perguntas (AT-012..016)."""

from __future__ import annotations

from pathlib import Path

from graph_lab.digraph import DiGraph
from graph_lab.extract import extrair
from graph_lab.memory import FatoTemporal, MemoriaTemporal
from graph_lab.metrics import calcular, ciclos_entre_componentes
from graph_lab.queries import codigo_morto, impacto

FIXTURE = Path(__file__).resolve().parent.parent / "fixture_repo" / "loja.py"
FONTE = FIXTURE.read_text(encoding="utf-8")

CALC = "loja.PedidoService.calcular_total"
FECHA = "loja.PedidoService.fechar_pedido"


def _componentes() -> tuple[DiGraph, dict[str, str]]:
    g = extrair("loja", FONTE).g
    comp = {}
    for n in g.nos():
        parte = n.split(".")[1] if n.count(".") >= 1 else "modulo"
        comp[n] = {"PedidoService": "vendas", "Auditoria": "auditoria"}.get(parte, parte.lower())
    return g, comp


def test_zonas_apontam_dor() -> None:
    g, comp = _componentes()
    metricas = {m.componente: m for m in calcular(g, comp)}
    assert metricas["vendas"].zona == "dor"  # estável e concreto, com dependente
    assert metricas["auditoria"].zona == "saudavel"
    assert all(m.distancia is not None for m in metricas.values())


def test_ciclo_detectado() -> None:
    g, comp = _componentes()
    assert g.ciclos() != []  # ping↔pong
    assert ciclos_entre_componentes(g, comp) == []  # intra-componente: quociente limpo


def test_a_indefinido_nao_inventado() -> None:
    g, comp = _componentes()
    (sem_dados,) = [
        m for m in calcular(g, comp, sem_abstrato=frozenset({"vendas"})) if m.componente == "vendas"
    ]
    assert sem_dados.abstratividade is None
    assert sem_dados.distancia is None
    assert sem_dados.zona == "indefinida"


def test_memoria_com_validade(tmp_path: Path) -> None:
    mem = MemoriaTemporal(tmp_path / "fatos.jsonl")
    mem.gravar(FatoTemporal(FECHA, "CHAMA", CALC, 1.0, "loja.py:17", "abc1"))
    assert len(mem.vigentes()) == 1
    assert mem.invalidar(FECHA, "abc2") == 1
    assert mem.vigentes() == []
    assert len(mem.valiam_em("abc1")) == 1
    assert mem.invalidar(FECHA, "abc3") == 0  # idempotente


def test_tres_perguntas_com_evidencia() -> None:
    g = extrair("loja", FONTE).g
    q1 = impacto(g, CALC)
    assert [a["afetado"] for a in q1] == [FECHA, "loja.Auditoria.auditar"]
    assert q1[0]["rota"] == [FECHA, CALC]
    q3 = codigo_morto(g, [FECHA])
    assert "loja.rotina_morta" in q3
