"""Tradução de erros de persistência para erros de domínio (lotes B02/B04).

A constraint ``UNIQUE`` no banco é a única garantia real contra slug
duplicado sob concorrência. Quando ela rejeita uma escrita, o driver
levanta um erro reconhecível:

- PostgreSQL (adapter canônico): a causa carrega o SQLSTATE ``23505``
  (unique_violation);
- SQLite (mecânica local dos testes): a causa é ``sqlite3.IntegrityError``
  com ``UNIQUE constraint failed`` na mensagem.

A tradução reconhece os dois sinais e devolve ``SlugConflictError``
(409 na fronteira); qualquer outro erro retorna ``None`` e quem chama
re-levanta o original.
"""

from __future__ import annotations

import sqlite3
from typing import Any

from link_shortener.domain import SlugConflictError

_UNIQUE_VIOLATION = "23505"
_SQLITE_UNIQUE = "UNIQUE constraint failed"


def pgcode_of(exc: BaseException) -> str | None:
    """Extrai o SQLSTATE da cadeia de causas, se houver."""
    seen: set[int] = set()
    current: BaseException | None = exc
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        pgcode: Any = getattr(current, "pgcode", None)
        if isinstance(pgcode, str) and pgcode:
            return pgcode
        sqlstate: Any = getattr(current, "sqlstate", None)
        if isinstance(sqlstate, str) and sqlstate:
            return sqlstate
        current = current.__cause__ or current.__context__
    return None


def translate_conflict(exc: BaseException, slug: str) -> SlugConflictError | None:
    """Traduz violação de unicidade em conflito de domínio.

    Devolve ``SlugConflictError`` quando o SQLSTATE é ``23505``
    (PostgreSQL) ou a causa é violação de unicidade do SQLite, e
    ``None`` quando o erro não é um conflito de slug — nesse caso quem
    chama deve re-levantar o erro original.
    """
    if pgcode_of(exc) == _UNIQUE_VIOLATION:
        return SlugConflictError(f"slug já existe: {slug!r}")
    current: BaseException | None = exc
    seen: set[int] = set()
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if isinstance(current, sqlite3.IntegrityError) and _SQLITE_UNIQUE in str(current):
            return SlugConflictError(f"slug já existe: {slug!r}")
        current = current.__cause__ or current.__context__
    return None
