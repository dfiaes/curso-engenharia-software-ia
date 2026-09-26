"""Embeddings falsos determinísticos (lote M07).

Vetor por hash de tokens com gerador pseudoaleatório fixo por (modelo,
token): mesma entrada e mesmo modelo dão sempre o mesmo vetor — por isso
o cache funciona sem invalidação. Modelo distinto (semente distinta)
gera espaço incompatível: misturar é ruído, e a migração exige
reindexação blue-green. Prova mecânica local; modelo real é trilha
externa ao lab.
"""

from __future__ import annotations

import hashlib
import math
import re

DIM = 64


def _token_vector(modelo: str, token: str) -> list[float]:
    seed = int(hashlib.sha256(f"{modelo}::{token}".encode()).hexdigest(), 16)
    state = seed % (2**31 - 1) or 1
    vetor: list[float] = []
    for _ in range(DIM):
        state = (1103515245 * state + 12345) % 2**31
        vetor.append((state / 2**31) * 2.0 - 1.0)
    return vetor


def tokenizar(texto: str) -> list[str]:
    """Tokens normalizados: separa camelCase, snake_case e dígito/letra."""
    quebrado = re.sub(
        r"(?<=[a-z])(?=[A-Z0-9])|(?<=[A-Z])(?=[A-Z][a-z])|(?<=[A-Za-z])(?=\\d)|(?<=\\d)(?=[A-Za-z])",
        " ",
        texto,
    )
    return re.findall(r"[a-z0-9]+", quebrado.lower().replace("_", " "))


class FakeEmbedder:
    """Embedder determinístico com modelo gravado em cada vetor."""

    def __init__(self, modelo: str = "fake-emb-1") -> None:
        self.modelo = modelo
        self.calls = 0

    def embed(self, texto: str) -> list[float]:
        """Vetor normalizado (cosseno = produto interno)."""
        self.calls += 1
        acc = [0.0] * DIM
        for token in tokenizar(texto):
            for i, v in enumerate(_token_vector(self.modelo, token)):
                acc[i] += v
        norma = math.sqrt(sum(v * v for v in acc)) or 1.0
        return [v / norma for v in acc]


def cosseno(a: list[float], b: list[float]) -> float:
    """Similaridade de cosseno (vetores normalizados: produto interno)."""
    return sum(x * y for x, y in zip(a, b, strict=True))
