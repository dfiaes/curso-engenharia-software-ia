"""Oráculo AT-004: contrato do SQL + paridade da matemática.

O SQL executa SOMENTE no PostgreSQL do Capstone (Docker) — aqui BLOCKED.
Estes testes guardam contrato + matemática; não fingem execução PG.
"""

import json
from math import exp
from pathlib import Path

from metrics import resumir

RAIZ = Path(__file__).resolve().parent.parent
SQL = RAIZ / "pct_incerto.sql"
FIXTURES = RAIZ / "fixtures" / "calls.json"


def test_sql_menciona_tabela_e_colunas_do_contrato() -> None:
    texto = SQL.read_text(encoding="utf-8")
    assert "llm_calls" in texto
    assert "logprob_medio" in texto
    assert "tokens_incertos" in texto
    assert "tokens_saida" in texto


def test_sql_expoe_alias_pct_incerto_ordenado_por_confianca() -> None:
    texto = SQL.read_text(encoding="utf-8")
    assert "pct_incerto" in texto
    assert "ORDER BY logprob_medio ASC" in texto


def test_sql_usa_dialeto_postgresql() -> None:
    texto = SQL.read_text(encoding="utf-8")
    assert "::numeric" in texto
    assert "interval" in texto


def pct_incerto_sql(tokens_incertos: int, tokens_saida: int) -> float | None:
    """Replica 100.0 * tokens_incertos / nullif(tokens_saida, 0), com 1 casa."""
    if tokens_saida == 0:
        return None
    return round(100.0 * tokens_incertos / tokens_saida, 1)


def test_nullif_devolve_nulo_quando_saida_zero() -> None:
    assert pct_incerto_sql(0, 0) is None
    assert pct_incerto_sql(3, 6) == 50.0


def test_paridade_matematica_separa_bem_comportada_de_estranha() -> None:
    chamadas = json.loads(FIXTURES.read_text(encoding="utf-8"))
    lp_medio: dict[str, float] = {}
    ppl: dict[str, float] = {}
    pct: dict[str, float | None] = {}
    for chamada in chamadas:
        resumo = resumir(chamada["logprobs"])
        assert resumo is not None
        assert chamada["tokens_saida"] == resumo.total
        rotulo = str(chamada["rotulo"])
        lp_medio[rotulo] = round(resumo.medio, 3)
        ppl[rotulo] = round(exp(-resumo.medio), 2)
        pct[rotulo] = pct_incerto_sql(resumo.incertos, resumo.total)
    assert pct["bem-comportada"] == 0.0
    pct_estranha = pct["estranha"]
    assert pct_estranha is not None and pct_estranha > 0.0
    assert lp_medio["estranha"] < lp_medio["bem-comportada"]
    assert ppl["estranha"] > ppl["bem-comportada"]
