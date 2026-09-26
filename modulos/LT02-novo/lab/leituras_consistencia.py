"""Duas leituras: read-your-writes e monotonic reads.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (dataclasses).
Timeout e observacao ambigua: vira desconhecido, nunca veredito.
"""

from __future__ import annotations

from dataclasses import dataclass, field


class EstadoDesconhecido(RuntimeError):
    """Resposta ausente no prazo: reconciliar, nunca declarar como nao executado."""


@dataclass
class RegistroVersoes:
    """Versoes publicadas pelo decisor e vistas por cada leitor."""

    decidida: int = 0
    vistas: dict[str, int] = field(default_factory=dict)

    def publicar_versao(self) -> int:
        """Nova versao decidida; publica o numero."""
        self.decidida += 1
        return self.decidida

    def ler_read_your_writes(self, autor: str, versao_do_autor: int) -> int:
        """O autor ve ao menos a propria escrita, mesmo sob replica atrasada."""
        vista = max(self.vistas.get(autor, 0), versao_do_autor, self.decidida)
        self.vistas[autor] = vista
        return vista

    def ler_monotonica(self, leitor: str, replica_versao: int) -> int:
        """O leitor nunca volta: fixa o maximo entre o ja visto e a replica."""
        vista = max(self.vistas.get(leitor, 0), replica_versao)
        self.vistas[leitor] = vista
        return vista

    def ler_com_prazo(self, leitor: str, replica_versao: int, no_prazo: bool) -> int:
        """Sem resposta no prazo: desconhecido, para reconciliar depois."""
        if not no_prazo:
            raise EstadoDesconhecido(f"sem resposta para {leitor!r} dentro do prazo")
        return self.ler_monotonica(leitor, replica_versao)
