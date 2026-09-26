"""Store: ACL primeiro, depois híbrida com RRF (lote M07).

Ordem inegociável: tenant, escopo, visibilidade e versão filtram ANTES
de qualquer ordenação — o que não passou nunca chega ao contexto. Depois
do filtro, léxico (sobreposição de termos) e vetorial (cosseno) geram
duas listas fundidas por Reciprocal Rank Fusion (posição, nunca soma de
scores). `tenant_id` é obrigatório e sem default: esquecer é erro de
construção, não vazamento.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from retrieval_lab.chunking import Chunk
from retrieval_lab.embeddings import FakeEmbedder, cosseno, tokenizar

K_RRF = 60


@dataclass(slots=True)
class _Acumulado:
    doc: DocIndexado
    pontos: float = 0.0
    listas: int = 0


@dataclass(slots=True)
class DocIndexado:
    chunk: Chunk
    tenant_id: str
    visibilidade: str = "interna"
    versao: str = "corrente"
    vetor: list[float] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class Hit:
    doc: DocIndexado
    score_rrf: float
    aparece_em: int


class TenantObrigatorio(TypeError):
    """Filtro de permissão ausente: erro de construção, nunca vazamento."""


class Store:
    """Índice em memória com filtros antes da relevância."""

    def __init__(self, embedder: FakeEmbedder) -> None:
        self._embedder = embedder
        self._docs: list[DocIndexado] = []

    def indexar(self, chunk: Chunk, tenant_id: str, visibilidade: str = "interna") -> DocIndexado:
        """Indexa com vetor do embedder e metadados de permissão."""
        doc = DocIndexado(chunk, tenant_id, visibilidade, vetor=self._embedder.embed(chunk.texto))
        self._docs.append(doc)
        return doc

    def _visiveis(self, tenant_id: str) -> list[DocIndexado]:
        return [d for d in self._docs if d.tenant_id == tenant_id and d.visibilidade == "interna"]

    def buscar_lexico(self, pergunta: str, tenant_id: str, k: int = 20) -> list[DocIndexado]:
        """Sobreposição de termos (TF simples): acha o identificador exato."""
        termos = set(tokenizar(pergunta))
        pontuados = [
            (sum(1 for t in termos if t in set(tokenizar(d.chunk.texto))), d)
            for d in self._visiveis(tenant_id)
        ]
        pontuados = [(p, d) for p, d in pontuados if p > 0]
        pontuados.sort(key=lambda pd: pd[0], reverse=True)
        return [d for _, d in pontuados[:k]]

    def buscar_vetorial(self, pergunta: str, tenant_id: str, k: int = 20) -> list[DocIndexado]:
        """Cosseno no espaço do embedder: acha paráfrase e conceito."""
        q = self._embedder.embed(pergunta)
        pontuados = sorted(
            self._visiveis(tenant_id), key=lambda d: cosseno(q, d.vetor), reverse=True
        )
        return pontuados[:k]

    def buscar_hibrido(self, pergunta: str, tenant_id: str, k: int = 20) -> list[Hit]:
        """RRF sobre as duas listas: consenso vence excelência isolada."""
        if not tenant_id:
            raise TenantObrigatorio("tenant_id é obrigatório e sem default")
        lex = self.buscar_lexico(pergunta, tenant_id, k=50)
        vec = self.buscar_vetorial(pergunta, tenant_id, k=50)
        acumulados: dict[int, _Acumulado] = {}
        for pos, doc in enumerate(lex, start=1):
            entry = acumulados.setdefault(id(doc), _Acumulado(doc))
            entry.pontos += 1.0 / (K_RRF + pos)
            entry.listas += 1
        for pos, doc in enumerate(vec, start=1):
            entry = acumulados.setdefault(id(doc), _Acumulado(doc))
            entry.pontos += 1.0 / (K_RRF + pos)
            entry.listas += 1
        ordenados = sorted(acumulados.values(), key=lambda e: e.pontos, reverse=True)
        return [Hit(doc=e.doc, score_rrf=e.pontos, aparece_em=e.listas) for e in ordenados][:k]
