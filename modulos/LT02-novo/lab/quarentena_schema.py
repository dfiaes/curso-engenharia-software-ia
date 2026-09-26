"""Gate de schema e quarentena poison com tentativas finitas.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (dataclasses).
Replay preserva identidade; quarentena nunca e descarte silencioso.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from fila_limitada import MensagemFila


class SchemaIncompativel(RuntimeError):
    """Versao fora do contrato: recusa explicita com a versao acusada."""


@dataclass
class GateSchema:
    """Versoes suportadas declaradas; o resto e recusa com causa."""

    versoes_suportadas: set[int] = field(default_factory=set)

    def aceitar(self, schema_versao: int) -> bool:
        """Verdadeiro somente para versao declarada como suportada."""
        return schema_versao in self.versoes_suportadas

    def validar(self, mensagem: MensagemFila) -> None:
        """Versao suportada passa; desconhecida levanta SchemaIncompativel."""
        if not self.aceitar(mensagem.schema_versao):
            raise SchemaIncompativel(
                f"schema v{mensagem.schema_versao} sem suporte para {mensagem.message_id!r}"
            )


@dataclass
class QuarentenaPoison:
    """Conta falhas por mensagem; no teto, quarentena com causa e replay seguro."""

    max_tentativas: int
    gate: GateSchema
    falhas: dict[str, int] = field(default_factory=dict)
    causas: dict[str, str] = field(default_factory=dict)
    quarentena: list[MensagemFila] = field(default_factory=list)

    def registrar_falha(self, mensagem: MensagemFila, causa: str) -> str:
        """Soma a falha; abaixo do teto pede repeticao, no teto quarentena."""
        total = self.falhas.get(mensagem.message_id, 0) + 1
        self.falhas[mensagem.message_id] = total
        if total >= self.max_tentativas:
            self.causas[mensagem.message_id] = causa
            self.quarentena.append(mensagem)
            return f"quarentena:{causa}"
        return "repetir"

    def registrar_sucesso(self, message_id: str) -> None:
        """Sucesso limpa a contagem: veneno e falha transitória se separam."""
        self.falhas.pop(message_id, None)
        self.causas.pop(message_id, None)

    def validar_antes_de_processar(self, mensagem: MensagemFila) -> None:
        """Gate antes do efeito: incompativel conta como falha com causa schema."""
        self.gate.validar(mensagem)

    def tamanho_quarentena(self) -> int:
        """Quantas mensagens a quarentena guarda neste instante."""
        return len(self.quarentena)

    def replay_seguro(self, message_id: str) -> MensagemFila | None:
        """Devolve a mensagem quarentenada com identidade e tentativa zerada."""
        for mensagem in self.quarentena:
            if mensagem.message_id == message_id:
                return MensagemFila(
                    message_id=mensagem.message_id,
                    chave=mensagem.chave,
                    schema_versao=mensagem.schema_versao,
                    payload=mensagem.payload,
                    attempt=0,
                )
        return None
