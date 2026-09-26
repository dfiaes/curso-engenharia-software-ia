"""Repositorio idempotente: chave mais intent_hash com estados duraveis.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (sqlite3, threading, dataclasses).
"""

from __future__ import annotations

import sqlite3
import threading
from dataclasses import dataclass


class ChaveConflito(RuntimeError):
    """Mesma chave com intent_hash distinto: conflito auditado, nunca reexecucao."""


@dataclass(frozen=True)
class RegistroIntencao:
    """Intencao persistida: chave, hash, estado, dono, resposta e causa."""

    chave: str
    intent_hash: str
    estado: str
    dono_token: int
    resposta: str = ""
    causa: str = ""


class RepositorioIdempotente:
    """Reserva, conclui e falha intencoes; repeticao identica reutiliza."""

    def __init__(self, caminho: str) -> None:
        """Abre o banco local; UNIQUE(chave) converte corrida em erro tratavel."""
        self._trava = threading.Lock()
        self._conexao = sqlite3.connect(caminho, check_same_thread=False)
        with self._trava:
            self._conexao.execute(
                "CREATE TABLE IF NOT EXISTS intencoes"
                " (chave TEXT PRIMARY KEY, intent_hash TEXT NOT NULL,"
                " estado TEXT NOT NULL, dono_token INTEGER NOT NULL,"
                " resposta TEXT NOT NULL, causa TEXT NOT NULL)"
            )
            self._conexao.commit()

    def reservar(self, chave: str, intent_hash: str, dono_token: int) -> str:
        """Reserva started; existente identico vira reutilizacao ou espera."""
        with self._trava:
            linha = self._conexao.execute(
                "SELECT intent_hash, estado, resposta FROM intencoes WHERE chave = ?",
                (chave,),
            ).fetchone()
            if linha is None:
                with self._conexao:
                    self._conexao.execute(
                        "INSERT INTO intencoes VALUES (?, ?, 'started', ?, '', '')",
                        (chave, intent_hash, dono_token),
                    )
                return "reservada"
            hash_antigo, estado, resposta = linha
            if hash_antigo != intent_hash:
                raise ChaveConflito(f"chave {chave!r} com intencao distinta")
            if estado == "completed":
                return f"dedup:{resposta}"
            return "em-processamento"

    def concluir(self, chave: str, dono_token: int, resposta: str) -> None:
        """Dono vigente persiste completed com resposta; token vencido recusa."""
        with self._trava, self._conexao:
            alteradas = self._conexao.execute(
                "UPDATE intencoes SET estado = 'completed', resposta = ?"
                " WHERE chave = ? AND dono_token = ?",
                (resposta, chave, dono_token),
            ).rowcount
            if alteradas == 0:
                raise PermissionError(f"dono invalido para {chave!r}")

    def falhar(self, chave: str, dono_token: int, causa: str) -> None:
        """Dono vigente persiste failed com causa; repeticao devolve a falha."""
        with self._trava, self._conexao:
            self._conexao.execute(
                "UPDATE intencoes SET estado = 'failed', causa = ?"
                " WHERE chave = ? AND dono_token = ?",
                (causa, chave, dono_token),
            )

    def obter(self, chave: str) -> RegistroIntencao | None:
        """Le a intencao persistida; None quando a chave nunca foi reservada."""
        with self._trava:
            linha = self._conexao.execute(
                "SELECT chave, intent_hash, estado, dono_token, resposta, causa"
                " FROM intencoes WHERE chave = ?",
                (chave,),
            ).fetchone()
        return RegistroIntencao(*linha) if linha is not None else None
