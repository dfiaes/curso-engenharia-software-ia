"""Grafo: extração, impacto, mortos e híbrido (AT-007..011,016)."""

from __future__ import annotations

from pathlib import Path

from graph_lab.extract import extrair
from graph_lab.hybrid import ancorar, expandir
from graph_lab.queries import codigo_morto, impacto

FIXTURE = Path(__file__).resolve().parent.parent / "fixture_repo" / "loja.py"
FONTE = FIXTURE.read_text(encoding="utf-8")

CALC = "loja.PedidoService.calcular_total"
FECHA = "loja.PedidoService.fechar_pedido"


def test_extracao_com_censo() -> None:
    resultado = extrair("loja", FONTE)
    metodos = [n for n in resultado.g.nos() if resultado.g.attrs(n).get("tipo") == "Metodo"]
    nomes = {m.split(".")[-1] for m in metodos}
    assert {"validar", "calcular_total", "fechar_pedido", "auditar", "ping", "pong"} <= nomes
    tipos = [n for n in resultado.g.nos() if resultado.g.attrs(n).get("tipo") == "Tipo"]
    assert {t.split(".")[-1] for t in tipos} >= {"PedidoService", "Auditoria", "Repositorio"}
    assert resultado.g.attrs("loja.Repositorio")["abstrato"] is True


def test_fqn_estavel_apos_deslocar() -> None:
    deslocada = "# novo\n" + FONTE
    antes = {n for n in extrair("loja", FONTE).g.nos()}
    depois = {n for n in extrair("loja", deslocada).g.nos()}
    assert antes == depois


def test_impacto_com_distancia_e_rota() -> None:
    g = extrair("loja", FONTE).g
    afetados = impacto(g, CALC)
    nomes = [a["afetado"] for a in afetados]
    assert nomes == [FECHA, "loja.Auditoria.auditar"]
    assert [a["distancia"] for a in afetados] == [1, 2]
    assert afetados[0]["rota"] == [FECHA, CALC]


def test_mortos_sao_candidatos() -> None:
    g = extrair("loja", FONTE).g
    mortos = codigo_morto(g, [FECHA])
    assert "loja.rotina_morta" in mortos
    assert "loja.Ping.ping" in mortos and "loja.Ping.pong" in mortos
    assert FECHA not in mortos and CALC not in mortos


def test_hibrido_ancora_e_expande() -> None:
    g = extrair("loja", FONTE).g
    simbolos = [n.split(".")[-1] for n in g.nos()]
    ancoras = ancorar("o que depende de calcular_total e validar", simbolos)
    assert {"calcular_total", "validar"} <= set(ancoras)
    vizinhos = expandir(g, [CALC])
    fqns = [v["fqn"] for v in vizinhos]
    assert FECHA in fqns
