"""Runner: dataset -> SUT -> graders -> relatório por categoria (lote M06).

Três decisões valem para qualquer suíte: graders universais (invariantes
de toda categoria), exceção conta como reprovação (quebrou, reprovou) e
concorrência limitada por semáforo (a suíte não se auto-DDoSa).
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import Callable, Coroutine
from pathlib import Path
from typing import Any

from eval_lab.cases import Caso, Resultado, carregar_pasta
from eval_lab.gate import METRIC_VERSION
from eval_lab.graders import GRADERS, Grader, g_linhas_existem

UNIVERSAIS: tuple[Grader, ...] = (g_linhas_existem,)

SUT = Callable[[Caso], Coroutine[Any, Any, tuple[dict[str, Any], float, int]]]


async def rodar_caso(caso: Caso, sut: SUT) -> Resultado:
    """Executa um caso: exceção é reprovação, nunca omissão."""
    try:
        saida, custo, latencia = await sut(caso)
    except Exception as exc:
        return Resultado(caso, False, f"exceção: {exc}")
    for grader in UNIVERSAIS:
        ok, motivo = grader(saida, caso)
        if not ok:
            return Resultado(caso, False, f"[universal] {motivo}", custo, latencia, saida)
    tipo = str(caso.espera.get("tipo", ""))
    if tipo not in GRADERS:
        return Resultado(caso, False, f"grader desconhecido: {tipo!r}", custo, latencia, saida)
    ok, motivo = GRADERS[tipo](saida, caso)
    return Resultado(caso, ok, "" if ok else motivo, custo, latencia, saida)


async def rodar_suite(pasta: Path, sut: SUT, concorrencia: int = 5) -> list[Resultado]:
    """Roda todos os casos com teto de concorrência (semáforo)."""
    casos = carregar_pasta(pasta)
    limite = asyncio.Semaphore(concorrencia)

    async def com_limite(caso: Caso) -> Resultado:
        async with limite:
            return await rodar_caso(caso, sut)

    return await asyncio.gather(*(com_limite(c) for c in casos))


def agregar(
    resultados: list[Resultado], *, dataset_id: str, sut_version: str
) -> dict[str, Any]:
    """Agrega contagens e identidade; taxas são derivadas das contagens."""
    por_cat: dict[str, list[bool]] = {}
    for r in resultados:
        por_cat.setdefault(r.caso.categoria, []).append(r.passou)
    return {
        "schema_version": 1,
        "dataset_id": dataset_id,
        "metric_version": METRIC_VERSION,
        "sut_version": sut_version,
        "por_categoria": {
            cat: {
                "passou": sum(v),
                "total": len(v),
                "taxa_pct": 100.0 * sum(v) / len(v),
            }
            for cat, v in sorted(por_cat.items())
        },
        "total": len(resultados),
        "custo_total": sum(r.custo_usd for r in resultados),
        "p95_ms": sorted([r.latencia_ms for r in resultados])[
            max(0, int(0.95 * len(resultados)) - 1)
        ]
        if resultados
        else 0,
    }


def salvar_relatorio(
    resultados: list[Resultado],
    destino: Path,
    *,
    dataset_id: str,
    sut_version: str,
) -> dict[str, Any]:
    """Persiste a evidência e identifica as versões avaliadas."""
    relatorio = agregar(resultados, dataset_id=dataset_id, sut_version=sut_version)
    relatorio["casos"] = [
        {"id": r.caso.id, "categoria": r.caso.categoria, "passou": r.passou, "motivo": r.motivo}
        for r in resultados
    ]
    destino.write_text(json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8")
    return relatorio
