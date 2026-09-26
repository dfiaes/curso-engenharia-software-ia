"""Saga compensavel: passos locais com desfazer idempotente.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (dataclasses).
Compensacao e nova acao de negocio; nunca rollback fisico.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SagaCompensavel:
    """Orquestra passos; compensa em ordem inversa; repete sem duplicar."""

    compensacoes: dict[str, str] = field(default_factory=dict)
    executados: list[str] = field(default_factory=list)
    compensados: list[str] = field(default_factory=list)
    casos_humanos: list[str] = field(default_factory=list)

    def registrar_passo(self, nome: str, compensacao: str | None) -> None:
        """Declara o passo; compensacao None marca pivot sem desfazer."""
        if compensacao is not None:
            self.compensacoes[nome] = compensacao

    def marcar_executado(self, nome: str) -> None:
        """Registra o passo concluido; repeticao nao duplica o rastro."""
        if nome not in self.executados:
            self.executados.append(nome)

    def compensar(self, falha_em: str) -> list[str]:
        """Desfaz executados ate a falha em ordem inversa, sem duplicar."""
        alvos = [
            passo
            for passo in reversed(self.executados)
            if passo != falha_em and passo in self.compensacoes
        ]
        aplicadas: list[str] = []
        for passo in alvos:
            acao = self.compensacoes[passo]
            if acao not in self.compensados:
                self.compensados.append(acao)
            aplicadas.append(acao)
        return aplicadas

    def abrir_caso_humano(self, chave: str, motivo: str) -> str:
        """Ambiguidade irreconciliavel vira caso explicito, nunca retry cego."""
        caso = f"caso-humano:{chave}:{motivo}"
        if caso not in self.casos_humanos:
            self.casos_humanos.append(caso)
        return caso
