"""Carga e tempo: dois relógios, vazão, Little e breakdown local/upstream.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (time).
Trabalho injetado pelo chamador; nenhuma rede, nenhum container.
"""

from __future__ import annotations

import time
from collections.abc import Callable


def medir_tempos[T](trabalho: Callable[[], T]) -> dict[str, float]:
    """Executa o trabalho uma vez; publica cpu_s (process_time) e parede_s (perf_counter)."""
    inicio_cpu = time.process_time()
    inicio_parede = time.perf_counter()
    trabalho()
    return {
        "cpu_s": time.process_time() - inicio_cpu,
        "parede_s": time.perf_counter() - inicio_parede,
    }


def taxa_vazao(concluidas: int, parede_s: float) -> float:
    """Conclusões por segundo; parede não positiva levanta ValueError."""
    if concluidas < 0:
        raise ValueError("concluidas não pode ser negativo")
    if not parede_s > 0:
        raise ValueError("parede_s precisa ser positiva")
    return concluidas / parede_s


def lei_little(vazao: float, latencia_s: float) -> float:
    """Concorrência média = vazão x latência; entradas negativas levantam ValueError."""
    if not vazao >= 0:
        raise ValueError("vazao não pode ser negativa")
    if not latencia_s >= 0:
        raise ValueError("latencia_s não pode ser negativa")
    return vazao * latencia_s


def dividir_latencias(local_s: float, upstream_s: float) -> dict[str, float]:
    """Breakdown do AT-042: publica local_s, upstream_s e total_s; negativos levantam ValueError."""
    if not local_s >= 0:
        raise ValueError("local_s não pode ser negativo")
    if not upstream_s >= 0:
        raise ValueError("upstream_s não pode ser negativo")
    return {"local_s": local_s, "upstream_s": upstream_s, "total_s": local_s + upstream_s}
