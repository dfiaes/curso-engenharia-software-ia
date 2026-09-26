"""Escrita sob particao: recusar ou aceitar e reconciliar.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (dataclasses).
Politica e parametro explicito; nenhum default escondido.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from barramento_fake import BarramentoFake, DestinoIsolado, Mensagem


@dataclass
class VisaoParticipante:
    """O que um participante sabe: ultima versao vista e de quem veio."""

    nome: str
    ultima_versao: int = 0
    origem: str = "nenhuma"


@dataclass
class ServicoEscrita:
    """Guarda a versao decidida e as visoes; reconcilia na reconexao."""

    barramento: BarramentoFake
    versao_decidida: int = 0
    visoes: dict[str, VisaoParticipante] = field(default_factory=dict)
    pendentes: list[Mensagem] = field(default_factory=list)

    def escrever_recusando(self, destino: str, mensagem: Mensagem) -> int:
        """Sob particao, recusa: erro em vez de promessa."""
        try:
            self.barramento.publicar(destino, mensagem)
        except DestinoIsolado:
            raise
        self.versao_decidida += 1
        self.visoes[destino] = VisaoParticipante(destino, self.versao_decidida, "decisor")
        return self.versao_decidida

    def escrever_reconciliando(self, destino: str, mensagem: Mensagem) -> str:
        """Sob particao, aceita local e enfileira para reconciliar depois."""
        try:
            self.barramento.publicar(destino, mensagem)
        except DestinoIsolado:
            self.pendentes.append(mensagem)
            return "aceita-pendente"
        self.versao_decidida += 1
        self.visoes[destino] = VisaoParticipante(destino, self.versao_decidida, "decisor")
        return "confirmada"

    def reconciliar(self) -> int:
        """Republica os pendentes apos a particao; publica quantos convergiu."""
        self.barramento.desativar_particao()
        concluidas = 0
        for mensagem in self.pendentes:
            self.barramento.publicar(mensagem.tenant_id, mensagem)
            concluidas += 1
        self.pendentes.clear()
        self.versao_decidida += concluidas
        return concluidas
