"""Trace context e sinais de fila sem dado sensivel.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (dataclasses).
IDs atravessam; conteudo de negocio nunca entra no rastro.
"""

from __future__ import annotations

from dataclasses import dataclass, field


class DadoSensivel(RuntimeError):
    """Atributo com conteudo de negocio: recusado no rastro."""


_SUFIXOS_VEDADOS = ("senha", "segredo", "documento", "cartao")


@dataclass(frozen=True)
class ContextoRastro:
    """Identidade da mensagem nos tres saltos."""

    trace_id: str
    mensagem_id: str
    correlacao_id: str
    tenant_id: str
    tentativa: int

    def propagar(self, tentativa: int) -> ContextoRastro:
        """Deriva o salto seguinte: mesmos IDs, tentativa atualizada."""
        return ContextoRastro(
            self.trace_id, self.mensagem_id, self.correlacao_id, self.tenant_id, tentativa
        )

    def anotar(self, nome_atributo: str) -> None:
        """Veta atributo com dado sensivel antes de registrar."""
        reduzido = nome_atributo.strip().lower()
        for vedado in _SUFIXOS_VEDADOS:
            if vedado in reduzido:
                raise DadoSensivel(f"atributo {nome_atributo!r} fora do rastro")


@dataclass
class SinaisFila:
    """Idade, voo, redelivery e quarentena por contador logico."""

    idade_maxima: int = 0
    em_voo: int = 0
    redeliveries: dict[str, int] = field(default_factory=dict)
    quarentena: dict[str, str] = field(default_factory=dict)

    def publicar(self, idade: int) -> None:
        """Atualiza a idade maxima observada na fila."""
        if idade > self.idade_maxima:
            self.idade_maxima = idade

    def marcar_voo(self, quantidade: int) -> None:
        """Registra quantas seguem sem ack neste instante."""
        self.em_voo = quantidade

    def marcar_redelivery(self, mensagem_id: str) -> int:
        """Conta a reentrega; devolve o total da mensagem."""
        total = self.redeliveries.get(mensagem_id, 0) + 1
        self.redeliveries[mensagem_id] = total
        return total

    def quarentenar(self, mensagem_id: str, causa: str) -> None:
        """Destino observavel com causa; nunca descarte silencioso."""
        self.quarentena[mensagem_id] = causa
