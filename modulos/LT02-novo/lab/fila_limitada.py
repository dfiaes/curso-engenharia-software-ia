"""Fila limitada com ack, confirm e redelivery apos crash.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (queue, threading, dataclasses).
Sem rede, sem relogio de parede, sem adapter de produto.
"""

from __future__ import annotations

import queue
import threading
from dataclasses import dataclass


@dataclass(frozen=True)
class MensagemFila:
    """Envelope minimo do Bloco 2: identidade, chave, schema e tentativa."""

    message_id: str
    chave: str
    schema_versao: int
    payload: str
    attempt: int = 0


class FilaCheia(RuntimeError):
    """Publicacao recusada: capacidade esgotada, pressão explicita ao produtor."""


class ConfirmDesconhecido(RuntimeError):
    """Ack de mensagem fora do voo: nem pendente, nem em voo, nem confirmada."""


class FilaLimitada:
    """Fila com teto, voo limitado, confirm, ack e redelivery deterministica."""

    def __init__(self, capacidade: int, max_inflight: int) -> None:
        """Guarda o teto e o prefetch; fila vazia, voo vazio, efeitos zerados."""
        self._capacidade = capacidade
        self._max_inflight = max_inflight
        self._pendentes: queue.Queue[MensagemFila] = queue.Queue(maxsize=capacidade)
        self._em_voo: dict[str, MensagemFila] = {}
        self._confirmados: set[str] = set()
        self._efeitos: set[str] = set()
        self._trava = threading.Lock()

    def publicar(self, mensagem: MensagemFila) -> str:
        """Enfileira e devolve o confirm (message_id); cheia levanta FilaCheia."""
        try:
            self._pendentes.put_nowait(mensagem)
        except queue.Full:
            raise FilaCheia(f"fila cheia para {mensagem.message_id!r}") from None
        return mensagem.message_id

    def republicar_apos_confirm_perdido(self, mensagem: MensagemFila) -> str:
        """Confirm perdido: ja confirmada vira dedup sem republicar nem reefeito."""
        with self._trava:
            if mensagem.message_id in self._confirmados:
                return "confirmada-duplicata-dedup"
        return self.publicar(mensagem)

    def consumir(self) -> MensagemFila | None:
        """Retira uma mensagem para voo; sem capacidade de prefetch devolve None."""
        with self._trava:
            if len(self._em_voo) >= self._max_inflight:
                return None
        try:
            mensagem = self._pendentes.get_nowait()
        except queue.Empty:
            return None
        with self._trava:
            self._em_voo[mensagem.message_id] = mensagem
        return mensagem

    def confirmar(self, message_id: str) -> None:
        """Ack apos processamento: tira do voo, registra confirmada e um efeito."""
        with self._trava:
            mensagem = self._em_voo.pop(message_id, None)
            if mensagem is None:
                if message_id in self._confirmados:
                    return
                raise ConfirmDesconhecido(f"ack sem voo para {message_id!r}")
            self._confirmados.add(message_id)
            self._efeitos.add(message_id)

    def redeliverar_apos_crash(self) -> int:
        """Devolve o voo a fila com attempt incrementado; publica quantas voltaram."""
        with self._trava:
            em_voo = list(self._em_voo.values())
            self._em_voo.clear()
        voltaram = 0
        for mensagem in em_voo:
            repetida = MensagemFila(
                message_id=mensagem.message_id,
                chave=mensagem.chave,
                schema_versao=mensagem.schema_versao,
                payload=mensagem.payload,
                attempt=mensagem.attempt + 1,
            )
            self._pendentes.put_nowait(repetida)
            voltaram += 1
        return voltaram

    def profundidade(self) -> int:
        """Quantas mensagens aguardam consumo neste instante."""
        return self._pendentes.qsize()

    def em_voo(self) -> int:
        """Quantas mensagens estao sem ack neste instante."""
        with self._trava:
            return len(self._em_voo)

    def efeitos(self) -> int:
        """Quantos efeitos logicos o ledger contou (oraculo de duplicata)."""
        with self._trava:
            return len(self._efeitos)
