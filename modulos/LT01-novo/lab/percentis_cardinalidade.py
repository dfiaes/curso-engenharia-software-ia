"""Percentis e cardinalidade: cauda resumida, custo contido.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (threading).
Amostras em memória; guarda com teto declarado e recusa explícita.
"""

from __future__ import annotations

import math
import threading


def percentil(amostras: list[float], p: float) -> float:
    """Latência abaixo da qual cai p por cento das amostras.

    Ordena a cópia; p fora de [0, 100] ou lista vazia: ValueError.
    """
    if not amostras:
        raise ValueError("amostras vazia não tem percentil")
    if not 0 <= p <= 100:
        raise ValueError("p precisa estar em [0, 100]")
    ordenadas = sorted(amostras)
    if p == 0:
        return ordenadas[0]
    posicao = math.ceil(p / 100 * len(ordenadas)) - 1
    return ordenadas[max(0, min(posicao, len(ordenadas) - 1))]


def resumo(amostras: list[float]) -> dict[str, float]:
    """Publica contagem, p50, p95 e máximo para o oráculo AT-040."""
    return {
        "contagem": float(len(amostras)),
        "p50": percentil(amostras, 50),
        "p95": percentil(amostras, 95),
        "maximo": percentil(amostras, 100),
    }


class GuardaCardinalidade:
    """Teto declarado de séries; acima do teto, recusa sem expulsar.

    A chave da série é (nome, rótulos ordenados): path com segmento
    livre vira uma série por operação — a explosão do AT-050.
    """

    def __init__(self, teto: int) -> None:
        if teto < 1:
            raise ValueError("teto precisa ser ao menos 1")
        self._teto = teto
        self._series: set[tuple[str, tuple[tuple[str, str], ...]]] = set()
        self._recusadas = 0
        self._trava = threading.Lock()

    def registrar(self, nome: str, rotulos: dict[str, str]) -> bool:
        """True se a série cabe ou já existe; False se recusada pelo teto."""
        chave = (nome, tuple(sorted(rotulos.items())))
        with self._trava:
            if chave in self._series:
                return True
            if len(self._series) >= self._teto:
                self._recusadas += 1
                return False
            self._series.add(chave)
            return True

    def remover(self, nome: str, rotulos: dict[str, str]) -> None:
        """Remove a série problemática; diagnóstico das demais preservado."""
        chave = (nome, tuple(sorted(rotulos.items())))
        with self._trava:
            self._series.discard(chave)

    def contagem(self) -> int:
        """Séries distintas retidas no momento."""
        with self._trava:
            return len(self._series)

    def recusadas(self) -> int:
        """Total recusado pelo teto desde a criação."""
        with self._trava:
            return self._recusadas
