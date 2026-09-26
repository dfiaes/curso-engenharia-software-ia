"""Rede determinística com seed e relógio virtual (recorte B07-L)."""

from __future__ import annotations

import hashlib
import json
import random
from collections import deque
from collections.abc import Container
from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class EventoSimulado:
    """Mensagem programada na rede simulada."""

    chave: str
    intencao: str
    carga: str
    entrega_em: int
    tentativa: int = 1


class RedeSimulada:
    """Perda, duplicação e atraso programáveis com relógio virtual por evento.

    Limite auditável: simula entrega num único processo com seed fixa. Não
    prova partição real, quorum multiprocesso, relógio real, desempenho de
    rede ou durabilidade replicada.
    """

    ATRASO_TICKS = 3

    def __init__(
        self,
        *,
        seed: int,
        perda: Container[str] = (),
        duplicar: Container[str] = (),
        atraso: Container[str] = (),
    ) -> None:
        self.rng = random.Random(seed)
        self.perda, self.duplicar, self.atraso = perda, duplicar, atraso
        self.agora = 0  # relógio virtual: anda por evento, não por parede
        self._pendentes: deque[EventoSimulado] = deque()
        self._diario: list[tuple[int, str, str, int]] = []
        self.transmitidas = 0
        self.descartadas = 0

    def relogio(self) -> int:
        """Lê o relógio virtual sem avançá-lo."""
        return self.agora

    def transmitir(self, chave: str, intencao: str, carga: str) -> None:
        """Agenda a entrega; cada transmissão consome um tick virtual."""
        self.agora += 1
        self.transmitidas += 1
        if chave in self.perda:
            self.descartadas += 1
            self._diario.append((self.agora, "perda", chave, 0))
            return
        entrega_em = self.agora + (self.ATRASO_TICKS if chave in self.atraso else 0)
        copias = 2 if chave in self.duplicar else 1
        for tentativa in range(1, copias + 1):
            self._pendentes.append(EventoSimulado(chave, intencao, carga, entrega_em, tentativa))
        self._diario.append((self.agora, "agenda", chave, copias))

    def avancar(self, ticks: int) -> None:
        """Avança o relógio virtual sem parede, processo ou rede."""
        if ticks < 0:
            raise ValueError("ticks deve ser não-negativo")
        self.agora += ticks

    def colher(self) -> list[EventoSimulado]:
        """Entrega o vencido em ordem determinística; a seed decide o desempate."""
        vencidos = [e for e in self._pendentes if e.entrega_em <= self.agora]
        self._pendentes = deque(e for e in self._pendentes if e.entrega_em > self.agora)
        vencidos.sort(key=lambda e: e.entrega_em)
        inicio = 0
        while inicio < len(vencidos):
            fim = inicio
            while fim < len(vencidos) and vencidos[fim].entrega_em == vencidos[inicio].entrega_em:
                fim += 1
            lote = vencidos[inicio:fim]
            self.rng.shuffle(lote)
            vencidos[inicio:fim] = lote
            inicio = fim
        for evento in vencidos:
            self._diario.append((self.agora, "entrega", evento.chave, evento.tentativa))
        return vencidos

    @property
    def pendentes(self) -> int:
        """Eventos agendados ainda não vencidos."""
        return len(self._pendentes)

    def digest(self) -> str:
        """Digest do diário canônico (seed + amostra + digest = evidência)."""
        canonico = json.dumps(self._diario, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonico.encode("utf-8")).hexdigest()


@dataclass
class FilaLimitadaSimulada:
    """Fila bounded no recorte simulado (AT-018/019): admissão limitada e overload explícito."""

    capacidade: int
    admitidos: int = 0
    rejeitados: int = 0
    consumidos: int = 0
    descartados: int = 0
    profundidade_maxima: int = 0
    limpeza_executada: bool = False
    _itens: deque[str] = field(default_factory=deque)

    def __post_init__(self) -> None:
        if self.capacidade < 1:
            raise ValueError("capacidade deve ser positiva")

    def admitir(self, item: str) -> bool:
        """Aceita até a capacidade; além dela rejeita sem enfileirar."""
        if len(self._itens) >= self.capacidade:
            self.rejeitados += 1
            return False
        self._itens.append(item)
        self.admitidos += 1
        self.profundidade_maxima = max(self.profundidade_maxima, len(self._itens))
        return True

    def consumir(self) -> str | None:
        """Remove o próximo item ou retorna None quando vazia."""
        if not self._itens:
            return None
        self.consumidos += 1
        return self._itens.popleft()

    def cancelar(self) -> None:
        """Cleanup em cancelamento: pendentes viram descarte contabilizado, sem órfãos."""
        try:
            self.descartados += len(self._itens)
            self._itens.clear()
        finally:
            self.limpeza_executada = True

    @property
    def pendentes(self) -> int:
        """Itens enfileirados ainda não consumidos nem descartados."""
        return len(self._itens)

    def sem_orfaos(self) -> bool:
        """Todo admitido está consumido, descartado ou ainda enfileirado."""
        return self.admitidos == self.consumidos + self.descartados + len(self._itens)


@dataclass
class OperacaoSimulada:
    """Operação possuída com prazo em ticks virtuais (AT-020/021 no recorte)."""

    nome: str
    inicio: int
    prazo_ticks: int
    concluida: bool = False
    cancelada: bool = False
    limpeza_executada: bool = False

    def __post_init__(self) -> None:
        if self.prazo_ticks <= 0:
            raise ValueError("prazo_ticks deve ser positivo")

    def expirada(self, agora: int) -> bool:
        """Timeout é palpite: vale quando o prazo virtual passou sem conclusão."""
        return (
            not self.concluida and not self.cancelada and (agora - self.inicio) >= self.prazo_ticks
        )

    def concluir(self) -> None:
        """Marca conclusão dentro do prazo."""
        self.concluida = True

    def cancelar(self) -> None:
        """Cancela com cleanup garantido no caminho de saída."""
        try:
            self.cancelada = True
        finally:
            self.limpeza_executada = True

    def expirar(self, agora: int) -> bool:
        """Timeout cancela a operação possuída; fora do prazo nada acontece."""
        if not self.expirada(agora):
            return False
        self.cancelar()
        return True

    @property
    def finalizada(self) -> bool:
        """Sem órfã: ou concluiu ou foi cancelada com cleanup."""
        return self.concluida or self.cancelada
