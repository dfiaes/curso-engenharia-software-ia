"""Pipeline: limiar, abstenção e verificação de saída (lote M07).

A resposta certa quando nada passa do limiar é "não encontrei" — nunca
plausível a partir de contexto ruim. E antes de responder, cada chunk
citado é verificado contra o tenant do requisitante (camada 4).
"""

from __future__ import annotations

from dataclasses import dataclass

from retrieval_lab.rerank import Rerankeado
from retrieval_lab.store import Hit

LIMIAR_RERANK = 0.35
MIN_CHUNKS = 1


class VazamentoNaSaida(ValueError):
    """Chunk citado pertence a outro tenant: alerta, nunca resposta."""


@dataclass(frozen=True, slots=True)
class ContextoRecuperado:
    chunks: tuple[Rerankeado, ...]
    abstem: bool
    motivo: str


def verificar_saida(chunks: list[Rerankeado] | list[Hit], tenant_id: str) -> None:
    """Camada 4: todo citado pertence ao requisitante."""
    estranhos = [c.doc.chunk.id_estavel for c in chunks if c.doc.tenant_id != tenant_id]
    if estranhos:
        raise VazamentoNaSaida(f"chunks de outro tenant na saída: {estranhos}")


def montar_contexto(
    pergunta: str, candidatos: list[Rerankeado], tenant_id: str, limiar: float = LIMIAR_RERANK
) -> ContextoRecuperado:
    """Aplica limiar + verificação; sem elegível, abstém com motivo."""
    verificar_saida(candidatos, tenant_id)
    elegiveis = [c for c in candidatos if c.score_rerank >= limiar]
    if len(elegiveis) < MIN_CHUNKS:
        melhor = max((c.score_rerank for c in candidatos), default=0.0)
        return ContextoRecuperado(
            chunks=(),
            abstem=True,
            motivo=f"nenhum trecho acima do limiar ({limiar}); melhor candidato: {melhor:.2f}",
        )
    return ContextoRecuperado(chunks=tuple(elegiveis[:5]), abstem=False, motivo="")
