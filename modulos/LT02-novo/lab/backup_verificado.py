"""Backup com manifesto, checksum e restore que falha visivel.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (sqlite3, dataclasses, hashlib).
Backup sem restore ensaiado e arquivo, nunca garantia.
"""

from __future__ import annotations

import hashlib
import sqlite3
from dataclasses import dataclass


class BackupInvalido(RuntimeError):
    """Manifesto divergente ou base ilegiveis: aborta sem promover evidencia."""


@dataclass(frozen=True)
class ManifestoBackup:
    """O que permite confiar: origem, ponto, linhas e checksum."""

    origem: str
    seq_ate: int
    linhas: int
    checksum: str


@dataclass
class BackupVerificado:
    """Copia, confere e restaura; invalido falha com causa legivel."""

    def gerar(self, origem: str, destino: str, seq_ate: int) -> ManifestoBackup:
        """Copia o journal ate o ponto para destino isolado com checksum."""
        fonte = sqlite3.connect(origem, check_same_thread=False)
        try:
            linhas = fonte.execute(
                "SELECT seq, operacao, chave, valor FROM journal WHERE seq <= ? ORDER BY seq",
                (seq_ate,),
            ).fetchall()
        finally:
            fonte.close()
        copia = sqlite3.connect(destino, check_same_thread=False)
        try:
            copia.execute(
                "CREATE TABLE IF NOT EXISTS journal"
                " (seq INTEGER PRIMARY KEY, operacao TEXT NOT NULL,"
                " chave TEXT NOT NULL, valor TEXT NOT NULL)"
            )
            with copia:
                copia.executemany("INSERT OR REPLACE INTO journal VALUES (?, ?, ?, ?)", linhas)
        finally:
            copia.close()
        soma = hashlib.sha256(repr(linhas).encode("utf-8")).hexdigest()
        return ManifestoBackup(origem, seq_ate, len(linhas), soma)

    def verificar(self, destino: str, manifesto: ManifestoBackup) -> None:
        """Confere linhas e checksum; divergencia levanta BackupInvalido."""
        copia = sqlite3.connect(destino, check_same_thread=False)
        try:
            linhas = copia.execute(
                "SELECT seq, operacao, chave, valor FROM journal ORDER BY seq"
            ).fetchall()
        finally:
            copia.close()
        soma = hashlib.sha256(repr(linhas).encode("utf-8")).hexdigest()
        if len(linhas) != manifesto.linhas or soma != manifesto.checksum:
            raise BackupInvalido(
                f"backup {destino!r} diverge do manifesto:"
                f" {len(linhas)} linhas contra {manifesto.linhas}"
            )

    def restaurar(self, destino: str, manifesto: ManifestoBackup, alvo: str) -> int:
        """Verifica antes de promover; invalido aborta sem tocar o alvo."""
        self.verificar(destino, manifesto)
        copia = sqlite3.connect(destino, check_same_thread=False)
        try:
            linhas = copia.execute(
                "SELECT operacao, chave, valor FROM journal ORDER BY seq"
            ).fetchall()
        finally:
            copia.close()
        estado: dict[str, str] = {}
        for operacao, chave, valor in linhas:
            if operacao == "excluir":
                estado.pop(str(chave), None)
            else:
                estado[str(chave)] = str(valor)
        final = sqlite3.connect(alvo, check_same_thread=False)
        try:
            final.execute(
                "CREATE TABLE IF NOT EXISTS recuperado"
                " (chave TEXT PRIMARY KEY, valor TEXT NOT NULL)"
            )
            with final:
                for chave, valor in estado.items():
                    final.execute(
                        "INSERT OR REPLACE INTO recuperado VALUES (?, ?)",
                        (chave, valor),
                    )
        finally:
            final.close()
        return len(estado)
