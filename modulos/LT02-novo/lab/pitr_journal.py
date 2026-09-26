"""Journal local numerado com PITR em instancia isolada.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (sqlite3, dataclasses).
Restore nunca sobrescreve a origem; ponto e sequencia, nunca relogio.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass


@dataclass(frozen=True)
class EntradaJournal:
    """Linha do diario: sequencia, operacao, chave e valor."""

    seq: int
    operacao: str
    chave: str
    valor: str


@dataclass
class JournalPitr:
    """Base mais diario; leitura e restore por ponto de sequencia."""

    caminho: str
    _conexao: sqlite3.Connection | None = None

    def abrir(self) -> None:
        """Abre o banco local e cria o journal numerado."""
        self._conexao = sqlite3.connect(self.caminho, check_same_thread=False)
        assert self._conexao is not None
        self._conexao.execute(
            "CREATE TABLE IF NOT EXISTS journal"
            " (seq INTEGER PRIMARY KEY AUTOINCREMENT,"
            " operacao TEXT NOT NULL, chave TEXT NOT NULL,"
            " valor TEXT NOT NULL)"
        )
        self._conexao.commit()

    def escrever(self, chave: str, valor: str) -> int:
        """Acrescenta escrita ao journal; devolve a sequencia."""
        assert self._conexao is not None
        with self._conexao:
            (seq,) = self._conexao.execute(
                "INSERT INTO journal (operacao, chave, valor)"
                " VALUES ('escrever', ?, ?) RETURNING seq",
                (chave, valor),
            ).fetchone()
        return int(seq)

    def excluir(self, chave: str) -> int:
        """Acrescenta exclusao valida ao journal; devolve a sequencia."""
        assert self._conexao is not None
        with self._conexao:
            (seq,) = self._conexao.execute(
                "INSERT INTO journal (operacao, chave, valor)"
                " VALUES ('excluir', ?, '') RETURNING seq",
                (chave,),
            ).fetchone()
        return int(seq)

    def ler_em(self, chave: str, ate_seq: int) -> str | None:
        """Valor da chave rejogado ate a sequencia; excluido devolve None."""
        assert self._conexao is not None
        linhas = self._conexao.execute(
            "SELECT operacao, valor FROM journal WHERE chave = ? AND seq <= ? ORDER BY seq",
            (chave, ate_seq),
        ).fetchall()
        atual: str | None = None
        for operacao, valor in linhas:
            atual = None if operacao == "excluir" else str(valor)
        return atual

    def restaurar_ate(self, ate_seq: int, destino: str) -> int:
        """Rejoga ate o ponto em banco isolado; publica quantas chaves voltou."""
        isolado = sqlite3.connect(destino, check_same_thread=False)
        try:
            isolado.execute(
                "CREATE TABLE IF NOT EXISTS recuperado"
                " (chave TEXT PRIMARY KEY, valor TEXT NOT NULL)"
            )
            assert self._conexao is not None
            chaves = self._conexao.execute(
                "SELECT DISTINCT chave FROM journal WHERE seq <= ?", (ate_seq,)
            ).fetchall()
            voltaram = 0
            with isolado:
                for (chave,) in chaves:
                    valor = self.ler_em(str(chave), ate_seq)
                    if valor is not None:
                        isolado.execute(
                            "INSERT OR REPLACE INTO recuperado VALUES (?, ?)",
                            (str(chave), valor),
                        )
                        voltaram += 1
            return voltaram
        finally:
            isolado.close()
