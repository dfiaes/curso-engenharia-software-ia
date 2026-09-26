"""Memória RSS: residente atual, crescimento e veredito em três leituras.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (os, resource).
POSIX: fora de plataforma com resource, indisponibilidade registrada.
Conversão ru_maxrss em bytes na semântica Linux documentada no contrato.
"""

from __future__ import annotations

import os
import resource


def rss_bytes() -> int:
    """Residente atual do processo em bytes (semântica Linux: ru_maxrss x 1024)."""
    _ = os.getpid()
    pico = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return int(pico) * 1024


def crescimento_bytes(antes: int, depois: int) -> int:
    """Diferença entre duas leituras; entradas negativas levantam ValueError."""
    if antes < 0 or depois < 0:
        raise ValueError("leituras de RSS não podem ser negativas")
    return depois - antes


def classificar_crescimento(baseline: int, pico: int, apos_limpeza: int, tolerancia: int) -> str:
    """Veredito do AT-041: 'vazamento', 'cache' ou 'baseline'.

    Pico alto que a limpeza reverte até a tolerância é cache;
    patamar que não volta até a tolerância é vazamento;
    o resto é baseline. Entradas negativas ou tolerância negativa: ValueError.
    """
    for valor in (baseline, pico, apos_limpeza):
        if valor < 0:
            raise ValueError("leituras de RSS não podem ser negativas")
    if tolerancia < 0:
        raise ValueError("tolerancia não pode ser negativa")
    if apos_limpeza > baseline + tolerancia:
        return "vazamento"
    if pico > baseline + tolerancia:
        return "cache"
    return "baseline"
