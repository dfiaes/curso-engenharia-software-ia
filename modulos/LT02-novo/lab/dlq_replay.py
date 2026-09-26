"""DLQ observavel com replay que preserva identidade e causalidade.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (dataclasses).
Quarentena nunca e descarte: replay exige causa corrigida.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class MensagemDlq:
    """Envelope quarentenado: IDs, causalidade, tentativa e causa."""

    message_id: str
    correlation_id: str
    causation_id: str
    chave: str
    intent_hash: str
    attempt: int
    causa: str


@dataclass
class DlqSegura:
    """Guarda mensagens integrais; replay preserva IDs e zera attempt."""

    quarentena: list[MensagemDlq] = field(default_factory=list)

    def quarentenar(self, mensagem: MensagemDlq) -> str:
        """Guarda a mensagem integral; repeticao nao duplica o rastro."""
        if all(m.message_id != mensagem.message_id for m in self.quarentena):
            self.quarentena.append(mensagem)
        return f"quarentena:{mensagem.causa}"

    def buscar(self, message_id: str) -> MensagemDlq | None:
        """Consulta sem remover: DLQ e observavel, nao cemiterio."""
        for mensagem in self.quarentena:
            if mensagem.message_id == message_id:
                return mensagem
        return None

    def replay(self, message_id: str) -> MensagemDlq | None:
        """Devolve copia com mesmos IDs e attempt zerado para nova rodada."""
        original = self.buscar(message_id)
        if original is None:
            return None
        return MensagemDlq(
            message_id=original.message_id,
            correlation_id=original.correlation_id,
            causation_id=original.causation_id,
            chave=original.chave,
            intent_hash=original.intent_hash,
            attempt=0,
            causa="",
        )

    def tamanho(self) -> int:
        """Quantas mensagens a quarentena guarda neste instante."""
        return len(self.quarentena)
