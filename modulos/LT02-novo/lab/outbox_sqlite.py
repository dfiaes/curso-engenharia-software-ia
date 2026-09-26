"""Outbox SQLite: estado de negocio mais evento no mesmo commit.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (sqlite3, threading, dataclasses).
Padrao local: NAO finge PostgreSQL; PG real e trilha BLOCKED.
"""

from __future__ import annotations

import sqlite3
import threading
from dataclasses import dataclass


@dataclass(frozen=True)
class RegistroOutbox:
    """Linha de outbox: chave, intencao, topico, payload e estado de publish."""

    outbox_id: str
    chave: str
    intent_hash: str
    topico: str
    payload: str
    publicada: bool = False


class OutboxSqlite:
    """Job mais outbox na mesma transacao; relay republica pendentes."""

    def __init__(self, caminho: str) -> None:
        """Abre o banco local e cria as tabelas; trava serializa escritas."""
        self._caminho = caminho
        self._trava = threading.Lock()
        self._conexao = sqlite3.connect(caminho, check_same_thread=False)
        with self._trava:
            self._conexao.execute(
                "CREATE TABLE IF NOT EXISTS outbox"
                " (outbox_id TEXT PRIMARY KEY, chave TEXT NOT NULL,"
                " intent_hash TEXT NOT NULL, topico TEXT NOT NULL,"
                " payload TEXT NOT NULL, publicada INTEGER NOT NULL)"
            )
            self._conexao.commit()

    def gravar_job_com_outbox(self, registro: RegistroOutbox) -> None:
        """Grava estado mais evento no mesmo commit; nunca publica aqui."""
        with self._trava, self._conexao:
            self._conexao.execute(
                "INSERT INTO outbox VALUES (?, ?, ?, ?, ?, 0)",
                (
                    registro.outbox_id,
                    registro.chave,
                    registro.intent_hash,
                    registro.topico,
                    registro.payload,
                ),
            )

    def listar_pendentes(self, limite: int) -> list[RegistroOutbox]:
        """Devolve ate limite linhas nao publicadas, em ordem de gravacao."""
        with self._trava:
            linhas = self._conexao.execute(
                "SELECT outbox_id, chave, intent_hash, topico, payload"
                " FROM outbox WHERE publicada = 0 ORDER BY rowid LIMIT ?",
                (limite,),
            ).fetchall()
        return [RegistroOutbox(*linha) for linha in linhas]

    def marcar_publicada(self, outbox_id: str) -> None:
        """Marca publicada somente apos confirm do barramento; nunca antes."""
        with self._trava, self._conexao:
            self._conexao.execute(
                "UPDATE outbox SET publicada = 1 WHERE outbox_id = ?",
                (outbox_id,),
            )

    def contar_pendentes(self) -> int:
        """Quantas linhas aguardam publish neste instante."""
        with self._trava:
            (total,) = self._conexao.execute(
                "SELECT COUNT(*) FROM outbox WHERE publicada = 0"
            ).fetchone()
        return int(total)
