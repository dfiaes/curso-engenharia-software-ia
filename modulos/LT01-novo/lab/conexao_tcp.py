"""Conexão TCP local: refused nasce no connect, reset nasce na leitura.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (socket, struct, threading).
Servidores só em 127.0.0.1 com porta efêmera; nenhum tráfego externo.
"""

from __future__ import annotations

import socket
import struct
import threading


class ConexaoRecusada(ConnectionError):
    """Porta fechada: o sistema recusou no connect."""


class ConexaoResetada(ConnectionError):
    """Conversa abortada: RST após o aceite, visível na leitura."""


def porta_livre_fechada() -> int:
    """Reserva uma porta efêmera e a libera: o próximo connect recusa."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sonda:
        sonda.bind(("127.0.0.1", 0))
        return int(sonda.getsockname()[1])


def servir_reset_uma_vez() -> int:
    """Aceita uma conexão em 127.0.0.1 e a aborta com RST; devolve a porta.

    O RST é forçado com SO_LINGER zerado: a leitura do cliente falha
    em vez de receber EOF limpo. Thread daemon; morre sozinha.
    """
    escuta = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    escuta.bind(("127.0.0.1", 0))
    escuta.listen(1)
    porta = int(escuta.getsockname()[1])

    def atender() -> None:
        with escuta:
            conn, _ = escuta.accept()
            with conn:
                conn.setsockopt(
                    socket.SOL_SOCKET,
                    socket.SO_LINGER,
                    struct.pack("ii", 1, 0),
                )
                # Sair do with fecha: com linger zero, o fechamento vira RST.

    processo = threading.Thread(target=atender, daemon=True)
    processo.start()
    return porta


def conectar(host: str, porta: int, prazo: float) -> socket.socket:
    """Conecta em host:porta; porta fechada vira ConexaoRecusada.

    O socket devolvido pertence ao chamador: feche após o uso.
    Reset pós-aceite não aparece aqui; aparece na leitura.
    """
    try:
        return socket.create_connection((host, porta), timeout=prazo)
    except ConnectionRefusedError as erro:
        raise ConexaoRecusada(f"{host}:{porta} recusou") from erro


def ler_ate_reset(conexao: socket.socket, prazo: float) -> None:
    """Lê até o abort: RST vira ConexaoResetada; EOF limpo retorna.

    Distingue o fim negociado (bytes vazios) do abort (reset).
    """
    conexao.settimeout(prazo)
    try:
        while True:
            parte = conexao.recv(4096)
            if not parte:
                return
    except ConnectionResetError as erro:
        raise ConexaoResetada("par abortou a conversa (RST)") from erro
