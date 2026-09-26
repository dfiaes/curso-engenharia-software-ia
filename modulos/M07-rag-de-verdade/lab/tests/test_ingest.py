"""Ingestão com filtro: gerado descartado, resto aproveitado (AT-014 parcial)."""

from __future__ import annotations

from conftest import CORPUS

from retrieval_lab.ingest import coletar


def test_gerado_descartado_util_aproveitado() -> None:
    arquivos, relatorio = coletar(CORPUS)
    nomes = {p.name for p in arquivos}
    assert "gerado.py" not in nomes
    assert {"cobranca.py", "relatorio.py", "globex.py"} <= nomes
    assert relatorio.aproveitados == len(arquivos)
    assert any("gerado" in d for d in relatorio.descartados)
