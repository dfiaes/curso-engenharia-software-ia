"""Barramento fake deterministico com particao controlada.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (dataclasses).
Sem rede, sem relogio de parede, sem adapter de produto.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Mensagem:
    """Envelope minimo da trilha: identidade, causalidade e prazo."""

    message_id: str
    correlation_id: str
    causation_id: str
    tenant_id: str
    intent_hash: str
    attempt: int
    occurred_at: int
    deadline_at: int
    schema_versao: int
    payload: str


class DestinoIsolado(RuntimeError):
    """Publicacao ou entrega contra participante sob particao ativa."""


@dataclass
class BarramentoFake:
    """Caixas por destinatario; particao e conjunto isolado explicito."""

    caixas: dict[str, list[Mensagem]] = field(default_factory=dict)
    isolados: set[str] = field(default_factory=set)
    publicados: int = 0

    def publicar(self, destino: str, mensagem: Mensagem) -> None:
        """Guarda na caixa do destino; sob particao, levanta sem guardar."""
        if destino in self.isolados:
            raise DestinoIsolado(f"particao ativa para {destino!r}")
        self.caixas.setdefault(destino, []).append(mensagem)
        self.publicados += 1

    def ativar_particao(self, destinos: set[str]) -> None:
        """Isola os destinos: nada chega ate a desativacao."""
        self.isolados |= set(destinos)

    def desativar_particao(self) -> None:
        """Reabre os canais; o acumulado pendente segue nas caixas."""
        self.isolados.clear()

    def entregar(self, destino: str) -> list[Mensagem]:
        """Esvazia a caixa do destino na ordem de publicacao."""
        return self.caixas.pop(destino, [])

    def profundidade(self, destino: str) -> int:
        """Quantas mensagens aguardam o destino neste instante."""
        return len(self.caixas.get(destino, []))
