"""Rerank falso + limiar calibrado + roteamento determinístico (lote M07).

O cross-encoder real lê pergunta e documento juntos; o falso pontua por
sobreposição de termos com bônus de símbolo — determinístico e suficiente
para provar o funil (ganho medido, limiar calibrado). O limiar nunca vem
de blog: `calibrar_limiar` o extrai da distribuição do SEU corpus.
Roteamento primeiro tenta regra barata; LLM só para o resto.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from retrieval_lab.embeddings import tokenizar
from retrieval_lab.store import DocIndexado, Hit


@dataclass(frozen=True, slots=True)
class Rerankeado:
    doc: DocIndexado
    score_rerank: float


def pontuar(pergunta: str, doc: DocIndexado) -> float:
    """Escore determinístico: overlap + bônus de símbolo + cobertura."""
    q = set(tokenizar(pergunta))
    d = set(tokenizar(doc.chunk.texto))
    if not q:
        return 0.0
    overlap = len(q & d) / len(q)
    simbolo = doc.chunk.simbolo.lower().replace("_", "")
    bonus = 0.5 if simbolo and simbolo in pergunta.lower().replace("_", "") else 0.0
    return overlap + bonus


def rerankear(
    pergunta: str, hits: list[Hit], top_k: int = 5, limiar: float = 0.0
) -> list[Rerankeado]:
    """Reordena os candidatos e corta abaixo do limiar."""
    pontuados = [Rerankeado(h.doc, pontuar(pergunta, h.doc)) for h in hits]
    pontuados.sort(key=lambda r: r.score_rerank, reverse=True)
    return [r for r in pontuados if r.score_rerank >= limiar][:top_k]


def calibrar_limiar(positivos: list[float], negativos: list[float]) -> float:
    """Limiar no ponto que aceita os bons e corta os ruins.

    Heurística honesta: média entre o pior positivo e o melhor negativo;
    sem sobreposição limpa, devolve o pior positivo.
    """
    if not positivos:
        return 1.0
    piso = min(positivos)
    teto = max(negativos) if negativos else 0.0
    return (piso + teto) / 2.0 if teto < piso else piso


def rotear(pergunta: str) -> str:
    """Rota determinística: identificador, estrutura, conceito.

    Barata, instantânea e testável — LLM só para o que a regra não decide.
    """
    texto = pergunta.lower()
    if any(m in texto for m in ("o que quebra", "quem chama", "depende", "impacto")):
        return "grafo"  # M10: nenhuma rota atual resolve; marcada, não inventada
    if re.search(r"[a-z]+_[a-z_]+|[A-Z][a-z]+[A-Z]\w*", pergunta):
        return "lexica"
    if re.search(r"\d{4,}|\d+/\d+|r\$\s*\d", texto):
        return "estruturado"
    return "hibrida"
