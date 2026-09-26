"""Niveis de isolamento sobre SQLite local com entrelacamento deterministico.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (sqlite3, dataclasses).
Padrao local: NAO finge PostgreSQL; PG real e trilha BLOCKED.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass


@dataclass(frozen=True)
class SaldoVersao:
    """Saldo com versao: a escrita carrega a versao que leu."""

    chave: str
    saldo: int
    versao: int


class ConflitoVersao(RuntimeError):
    """Escrita sobre versao superada: aborta com a versao acusada."""


@dataclass
class IsolamentoNiveis:
    """Conta com versao; nivel fraco perde, nivel forte verifica."""

    caminho: str
    _conexao: sqlite3.Connection | None = None

    def abrir(self) -> None:
        """Abre o banco local e cria a tabela de contas versionadas."""
        self._conexao = sqlite3.connect(self.caminho, check_same_thread=False)
        assert self._conexao is not None
        self._conexao.execute(
            "CREATE TABLE IF NOT EXISTS contas"
            " (chave TEXT PRIMARY KEY, saldo INTEGER NOT NULL,"
            " versao INTEGER NOT NULL)"
        )
        self._conexao.commit()

    def semear(self, chave: str, saldo: int) -> SaldoVersao:
        """Cria a conta na versao zero; devolve o registro semeado."""
        assert self._conexao is not None
        with self._conexao:
            self._conexao.execute("INSERT OR REPLACE INTO contas VALUES (?, ?, 0)", (chave, saldo))
        return SaldoVersao(chave, saldo, 0)

    def ler(self, chave: str) -> SaldoVersao:
        """Le o saldo com a versao vigente neste instante."""
        assert self._conexao is not None
        (saldo, versao) = self._conexao.execute(
            "SELECT saldo, versao FROM contas WHERE chave = ?", (chave,)
        ).fetchone()
        return SaldoVersao(chave, int(saldo), int(versao))

    def gravar_fraco(self, leitura: SaldoVersao, novo_saldo: int) -> SaldoVersao:
        """Nivel fraco: grava sem verificar a versao; entrelacado perde soma."""
        assert self._conexao is not None
        with self._conexao:
            self._conexao.execute(
                "UPDATE contas SET saldo = ?, versao = versao + 1 WHERE chave = ?",
                (novo_saldo, leitura.chave),
            )
        return self.ler(leitura.chave)

    def gravar_forte(self, leitura: SaldoVersao, novo_saldo: int) -> SaldoVersao:
        """Nivel forte: versao superada aborta com ConflitoVersao."""
        assert self._conexao is not None
        with self._conexao:
            aplicada = self._conexao.execute(
                "UPDATE contas SET saldo = ?, versao = versao + 1 WHERE chave = ? AND versao = ?",
                (novo_saldo, leitura.chave, leitura.versao),
            ).rowcount
            if aplicada == 0:
                raise ConflitoVersao(f"versao superada para {leitura.chave!r}")
        return self.ler(leitura.chave)
