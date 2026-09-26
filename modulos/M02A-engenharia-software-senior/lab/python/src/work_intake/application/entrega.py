"""Caixa de saída com chave+intenção e log de compensação (recorte B07-L)."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


class ConflictError(ValueError):
    """A mesma chave foi reutilizada para uma intenção diferente."""

    def __init__(self, chave: str) -> None:
        super().__init__(f"conflito de intenção para a chave {chave!r}")
        self.chave = chave


@dataclass(frozen=True, slots=True)
class RegistroEntrega:
    """Efeito publicado uma única vez por par chave+intenção."""

    chave: str
    intencao: str
    evento: str
    tick: int


@dataclass(frozen=True, slots=True)
class PassoSaga:
    """Passo transacional local com sua compensação correspondente."""

    nome: str
    executar: Callable[[], str]
    compensar: Callable[[], str]


class CaixaDeSaida:
    """Dedup por chave+intenção, conflito em colisão, persistir+publicar e compensação.

    Limite auditável: o diário é uma lista em memória compartilhada para
    simular o commit; prova lógica de entrega e compensação no recorte
    local, não durabilidade replicada nem coordenação entre processos.
    """

    def __init__(
        self, *, diario: list[dict[str, Any]] | None = None, agora: Callable[[], int] | None = None
    ) -> None:
        self.entregues: dict[tuple[str, str], RegistroEntrega] = {}
        self.chaves: dict[str, str] = {}
        self._pendentes: dict[tuple[str, str], tuple[str, int]] = {}
        self._publicados: list[RegistroEntrega] = []
        self._compensacoes: list[dict[str, Any]] = []
        self._diario = diario if diario is not None else []
        self._agora = agora
        self._ticks = 0
        for lancamento in self._diario:
            chave = str(lancamento["chave"])
            intencao = str(lancamento["intencao"])
            registro = RegistroEntrega(
                chave, intencao, str(lancamento["evento"]), int(lancamento["tick"])
            )
            self.chaves[chave] = intencao
            if bool(lancamento["publicado"]):
                self.entregues[(chave, intencao)] = registro
                self._publicados.append(registro)
            else:
                self._pendentes[(chave, intencao)] = (registro.evento, registro.tick)

    def _carimbo(self) -> int:
        if self._agora is not None:
            return self._agora()
        self._ticks += 1
        return self._ticks

    def persistir(self, chave: str, intencao: str, evento: str) -> None:
        """Persiste no mesmo commit da decisão: diário e pendente juntos."""
        tick = self._carimbo()
        self._diario.append(
            {
                "chave": chave,
                "intencao": intencao,
                "evento": evento,
                "tick": tick,
                "publicado": False,
            }
        )
        self._pendentes[(chave, intencao)] = (evento, tick)

    def publicar(self, chave: str, intencao: str) -> RegistroEntrega:
        """Publica após o commit; republicar o mesmo par é idempotente."""
        if (chave, intencao) in self.entregues:
            return self.entregues[(chave, intencao)]
        evento, _guardado = self._pendentes[(chave, intencao)]
        registro = RegistroEntrega(chave, intencao, evento, self._carimbo())
        self.entregues[(chave, intencao)] = registro
        self.chaves[chave] = intencao
        del self._pendentes[(chave, intencao)]
        for lancamento in self._diario:
            if lancamento["chave"] == chave and lancamento["intencao"] == intencao:
                lancamento["publicado"] = True
        self._publicados.append(registro)
        return registro

    def registrar_compensacao(self, passo: str, detalhe: str) -> None:
        """Anexa um fato ordenado ao log de compensação auditável."""
        self._compensacoes.append(
            {
                "ordem": len(self._compensacoes) + 1,
                "passo": passo,
                "detalhe": detalhe,
                "tick": self._carimbo(),
            }
        )

    @property
    def compensacoes(self) -> tuple[dict[str, Any], ...]:
        """Log de compensação em ordem de registro."""
        return tuple(self._compensacoes)

    @property
    def publicados(self) -> tuple[RegistroEntrega, ...]:
        """Registros publicados em ordem de publicação."""
        return tuple(self._publicados)

    @property
    def pendentes(self) -> int:
        """Pares persistidos ainda não publicados."""
        return len(self._pendentes)

    def reentregar(self) -> list[RegistroEntrega]:
        """Reentrega após 'queda': republica o pendente; o entregue deduplica."""
        return [self.publicar(chave, intencao) for chave, intencao in sorted(self._pendentes)]


def entregar(caixa: CaixaDeSaida, *, chave: str, intencao: str, evento: str) -> RegistroEntrega:
    if (chave, intencao) in caixa.entregues:
        return caixa.entregues[(chave, intencao)]  # repetição: reutiliza
    if chave in caixa.chaves and caixa.chaves[chave] != intencao:
        raise ConflictError(chave)  # colisão: intenção divergiu
    caixa.persistir(chave, intencao, evento)  # mesmo commit da decisão
    return caixa.publicar(chave, intencao)


class Saga:
    """Passos locais com compensação em ordem inversa; sem atomicidade global."""

    def __init__(self, nome: str, passos: list[PassoSaga]) -> None:
        if not passos:
            raise ValueError("saga exige ao menos um passo")
        self._nome = nome
        self._passos = list(passos)

    @property
    def nome(self) -> str:
        """Nome do fluxo compensável."""
        return self._nome

    def executar(self, caixa: CaixaDeSaida) -> list[str]:
        """Executa os passos; em falha compensa os concluídos na ordem inversa."""
        concluidos: list[PassoSaga] = []
        for passo in self._passos:
            try:
                passo.executar()
            except Exception as erro:
                caixa.registrar_compensacao(passo.nome, f"falha: {erro}")
                for feito in reversed(concluidos):
                    caixa.registrar_compensacao(feito.nome, feito.compensar())
                raise
            concluidos.append(passo)
        return [passo.nome for passo in concluidos]
