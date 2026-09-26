"""Registry, gate e tracing sanitizado (AT-008/010/011/012/013)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from eval_lab.gate import METRIC_VERSION, decidir
from eval_lab.prompts import carregar
from eval_lab.tracing import ContentLeakage, SpanRecorder, input_hash

LAB = Path(__file__).resolve().parent.parent
CATEGORIAS = ("golden", "fora_de_escopo", "injection", "vazamento", "acao_destrutiva", "bordas")


def _relatorio(taxa_golden: float, custo: float = 1.0) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "dataset_id": "m06-fixture-v1",
        "metric_version": METRIC_VERSION,
        "sut_version": "sut-v1",
        "total": 100 * len(CATEGORIAS),
        "custo_total": custo,
        "por_categoria": {
            categoria: {
                "passou": int(taxa_golden if categoria == "golden" else 100.0),
                "total": 100,
                "taxa_pct": taxa_golden if categoria == "golden" else 100.0,
            }
            for categoria in CATEGORIAS
        },
    }


def test_registry_com_tag_e_versoes() -> None:
    v1 = carregar("analista", 1)
    v2 = carregar("analista", 2)
    assert v1.tag == "analista@v1"
    assert v2.tag == "analista@v2"
    assert v1.texto != v2.texto
    assert carregar("analista").versao == 2  # None = maior versão


def test_gate_reprova_queda_acima_da_tolerancia() -> None:
    base = _relatorio(90.0)
    atual = _relatorio(85.0)
    falhas, _ = decidir(atual, base)
    assert len(falhas) == 1 and "golden" in falhas[0]


def test_gate_tolera_ruido() -> None:
    base = _relatorio(90.0)
    atual = _relatorio(89.0)
    assert decidir(atual, base) == ([], [])


def test_gate_piso_de_seguranca_bloqueia() -> None:
    base = _relatorio(100.0)
    base["por_categoria"]["injection"] = {"passou": 100, "total": 100, "taxa_pct": 100.0}
    atual = _relatorio(100.0)
    atual["por_categoria"]["injection"] = {"passou": 0, "total": 100, "taxa_pct": 0.0}
    falhas, _ = decidir(atual, base)
    assert any("piso" in f for f in falhas)


def test_gate_custo_avisa_sem_reprovar() -> None:
    base = _relatorio(90.0)
    atual = _relatorio(90.0, custo=1.5)
    falhas, avisos = decidir(atual, base)
    assert falhas == [] and any("custo" in a for a in avisos)


def test_tracing_metadados_ok_conteudo_bloqueado() -> None:
    rec = SpanRecorder()
    span = rec.record(
        "chat",
        {
            "gen_ai.request.model": "fake-1",
            "gen_ai.usage.input_tokens": 100,
            "cartografo.prompt_tag": "analista@v2",
            "input_hash": input_hash("texto sensível"),
        },
    )
    assert span.trace_id.startswith("trace-")
    with pytest.raises(ContentLeakage, match="prompt"):
        rec.record("chat", {"prompt": "texto sensível"})
    with pytest.raises(ContentLeakage):
        rec.record("chat", {"codigo": "x = 1"})
    assert len(rec.spans()) == 1


def test_hash_correlaciona_sem_guardar() -> None:
    assert input_hash("mesma entrada") == input_hash("mesma entrada")
    assert input_hash("outra") != input_hash("mesma entrada")
    assert "sensível" not in input_hash("texto sensível")
