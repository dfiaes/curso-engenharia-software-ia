"""Prova de restauracao: faults off, smoke verde, backlog drenado.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (dataclasses).
Drenagem em passadas limitadas; ledger externo decide duplicata e perda.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ProvaRestauracao:
    """As tres condicoes conjuntas do veredito GO."""

    faults_ligados: bool = True
    smoke_verde: bool = False
    backlog: list[str] = field(default_factory=list)
    efeitos: dict[str, int] = field(default_factory=dict)
    max_por_passada: int = 2

    def desligar_faults(self) -> None:
        """Primeira condicao: controlador sem falha ativa."""
        self.faults_ligados = False

    def marcar_smoke(self, verde: bool) -> None:
        """Segunda condicao: caminho feliz publica, consome e conclui."""
        self.smoke_verde = verde

    def drenar(self) -> int:
        """Terceira condicao: passadas limitadas ate zerar; devolve efeitos."""
        concluidos = 0
        while self.backlog:
            passada = self.backlog[: self.max_por_passada]
            del self.backlog[: self.max_por_passada]
            for mensagem_id in passada:
                self.efeitos[mensagem_id] = self.efeitos.get(mensagem_id, 0) + 1
                concluidos += 1
        return concluidos

    def veredito(self, esperados: set[str]) -> str:
        """GO exige off, smoke e backlog zerado sem duplicata nem perda."""
        if self.faults_ligados:
            return "NO-GO: faults ainda ligados"
        if not self.smoke_verde:
            return "NO-GO: smoke nao verde"
        if self.backlog:
            return "NO-GO: backlog nao drenado"
        if any(total != 1 for total in self.efeitos.values()):
            return "NO-GO: efeito logico duplicado"
        if set(self.efeitos) != esperados:
            return "NO-GO: mensagem sem destino observado"
        return "GO"
