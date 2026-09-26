"""Busca híbrida (lexical BM25 + vetorial-lite tf-idf) com ACL e abstenção (M13 B6).

Invariantes:
- ACL **antes** de recuperar: o índice filtra por ``tenant_id`` antes de pontuar;
  nenhum chunk de outro tenant entra no espaço de busca (zero vazamento).
- Threshold de abstenção: se o melhor score ficar abaixo do limiar, a resposta
  é "não sei" (lista vazia), nunca um palpite reranqueado.
- Dataset de retrieval versionado (``fixtures/retrieval/dataset_v1.json``)
  registra queries, chunks e os limiares Recall@k/MRR exigidos; a avaliação é
  um oráculo, não uma amostra.
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_TOKEN = re.compile(r"[a-zà-ú0-9_]+")
BM25_K1 = 1.5
BM25_B = 0.75


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    tenant_id: str
    path: str
    line: int
    text: str


@dataclass(frozen=True)
class Hit:
    chunk_id: str
    path: str
    line: int
    score: float
    snippet: str


def tokenize(text: str) -> list[str]:
    return _TOKEN.findall(text.lower())


def _cosine_tf(q: Counter[str], d: Counter[str]) -> float:
    if not q or not d:
        return 0.0
    inter = sum(min(q[t], d[t]) for t in q.keys() & d.keys())
    nq = math.sqrt(sum(v * v for v in q.values()))
    nd = math.sqrt(sum(v * v for v in d.values()))
    return inter / (nq * nd) if nq and nd else 0.0


class HybridIndex:
    """Índice híbrido em memória; escopo de tenant aplicado antes do scoring."""

    def __init__(self, alpha: float = 0.5) -> None:
        if not 0.0 <= alpha <= 1.0:
            raise ValueError("alpha deve estar em [0, 1]")
        self.alpha = alpha
        self._chunks: list[Chunk] = []
        self._tf: list[Counter[str]] = []
        self._df: Counter[str] = Counter()
        self._total_len = 0

    def add(self, chunk: Chunk) -> None:
        tf = Counter(tokenize(chunk.text))
        self._chunks.append(chunk)
        self._tf.append(tf)
        self._total_len += sum(tf.values())
        for term in tf:
            self._df[term] += 1

    def _bm25(self, q_tf: Counter[str], i: int, n_docs: int) -> float:
        d_tf = self._tf[i]
        d_len = sum(d_tf.values()) or 1
        avg = (self._total_len / max(len(self._chunks), 1)) or 1.0
        score = 0.0
        for term, qf in q_tf.items():
            tf = d_tf.get(term, 0)
            if tf == 0:
                continue
            idf = math.log(1 + (n_docs - self._df[term] + 0.5) / (self._df[term] + 0.5))
            denom = tf + BM25_K1 * (1 - BM25_B + BM25_B * d_len / avg)
            score += idf * (tf * (BM25_K1 + 1) / denom) * qf
        return score

    def search(self, tenant_id: str, query: str, top_k: int, threshold: float) -> list[Hit]:
        """ACL antes de recuperar: só chunk do tenant participa do scoring."""
        q_tf = Counter(tokenize(query))
        if not q_tf:
            return []
        scoped = [i for i, c in enumerate(self._chunks) if c.tenant_id == tenant_id]
        scored: list[tuple[float, int]] = []
        for i in scoped:
            bm = self._bm25(q_tf, i, max(len(scoped), 1))
            vec = _cosine_tf(q_tf, self._tf[i])
            scored.append((self.alpha * bm + (1 - self.alpha) * vec, i))
        scored.sort(key=lambda p: (p[0], self._chunks[p[1]].chunk_id), reverse=True)
        hits = [
            Hit(
                chunk_id=(c := self._chunks[i]).chunk_id,
                path=c.path,
                line=c.line,
                score=round(s, 6),
                snippet=c.text[:120],
            )
            for s, i in scored
            if s > 0.0
        ][:top_k]
        if not hits or hits[0].score < threshold:
            return []  # abstenção: melhor score abaixo do limiar
        return hits


def load_dataset(path: Path) -> dict[str, Any]:
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    for key in ("version", "chunks", "queries", "thresholds"):
        if key not in data:
            raise ValueError(f"dataset sem campo obrigatório: {key}")
    return data


def evaluate(index: HybridIndex, dataset: dict[str, Any], top_k: int) -> dict[str, float]:
    """Recall@k e MRR sobre o dataset versionado; zero consultas -> erro."""
    queries = dataset["queries"]
    if not queries:
        raise ValueError("dataset sem queries")
    recall_sum, mrr_sum = 0.0, 0.0
    for q in queries:
        relevant = set(q["relevant"])
        hits = index.search(q["tenant_id"], q["q"], top_k=top_k, threshold=q["threshold"])
        got = [h.chunk_id for h in hits]
        recall_sum += len(relevant & set(got)) / len(relevant)
        mrr_sum += next((1.0 / (rank + 1) for rank, cid in enumerate(got) if cid in relevant), 0.0)
    return {"recall_at_k": recall_sum / len(queries), "mrr": mrr_sum / len(queries)}


def meets_thresholds(metrics: dict[str, float], thresholds: dict[str, float]) -> list[str]:
    """Retorna violações; lista vazia = limiar pré-registrado atingido."""
    return [
        f"{name}: {metrics.get(name, 0.0):.3f} < {floor:.3f}"
        for name, floor in thresholds.items()
        if metrics.get(name, 0.0) < floor
    ]
