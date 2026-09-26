"""Particao por chave: ordem dentro da chave, paralelismo entre chaves.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (hashlib, dataclasses).
Sem rede, sem relogio de parede, sem adapter de produto.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field

from fila_limitada import FilaLimitada, MensagemFila


@dataclass
class ParticaoPorChave:
    """N filas limitadas; a chave escolhe a particao por hash estavel."""

    n_particoes: int
    particoes: list[FilaLimitada] = field(default_factory=list)

    def __init__(
        self, n_particoes: int, capacidade_por_particao: int, max_inflight_por_particao: int
    ) -> None:
        """Cria N filas limitadas identicas, uma por particao."""
        self.n_particoes = n_particoes
        self.particoes = [
            FilaLimitada(capacidade_por_particao, max_inflight_por_particao)
            for _ in range(n_particoes)
        ]

    def indice_para(self, chave: str) -> int:
        """Particao da chave: hash estavel, mesma chave sempre no mesmo indice."""
        digesto = hashlib.sha256(chave.encode("utf-8")).hexdigest()
        return int(digesto, 16) % self.n_particoes

    def publicar(self, mensagem: MensagemFila) -> tuple[int, str]:
        """Roteia pela chave e devolve (particao, confirm)."""
        indice = self.indice_para(mensagem.chave)
        confirm = self.particoes[indice].publicar(mensagem)
        return (indice, confirm)

    def consumir_da_particao(self, particao: int) -> MensagemFila | None:
        """Retira da particao em ordem de publicacao, sob o prefetch dela."""
        return self.particoes[particao].consumir()

    def confirmar(self, particao: int, message_id: str) -> None:
        """Ack na particao dona do voo."""
        self.particoes[particao].confirmar(message_id)

    def redeliverar_apos_crash(self, particao: int) -> int:
        """Devolve o voo da particao a fila, sem tocar nas demais."""
        return self.particoes[particao].redeliverar_apos_crash()
