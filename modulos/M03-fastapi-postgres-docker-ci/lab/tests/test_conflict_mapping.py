"""Tradução constraint -> 409 e controle negativo (AT-006, nível de regra).

Oráculo positivo: um erro cuja causa carrega SQLSTATE 23505 vira
``SlugConflictError``. Controle negativo (mutante): um erro qualquer SEM
esse sinal NÃO é traduzido — quem chama deve re-levantar o original.
Isso prova que o oráculo não aprova tudo.
"""

from link_shortener.domain import SlugConflictError
from link_shortener.errors import pgcode_of, translate_conflict


class _PgUniqueViolation(Exception):
    def __init__(self) -> None:
        super().__init__('duplicate key value violates unique constraint "uq_links_slug"')
        self.pgcode = "23505"


class _PgOtherError(Exception):
    def __init__(self) -> None:
        super().__init__("connection refused")
        self.pgcode = "08006"


def test_violacao_de_unicidade_vira_conflito() -> None:
    err = _PgUniqueViolation()
    assert pgcode_of(err) == "23505"
    wrapped = RuntimeError("insert falhou")
    wrapped.__cause__ = err
    conflict = translate_conflict(wrapped, "demo-1")
    assert isinstance(conflict, SlugConflictError)
    assert "demo-1" in str(conflict)


def test_erro_nao_relacionado_nao_e_traduzido() -> None:
    assert translate_conflict(_PgOtherError(), "demo-1") is None
    assert translate_conflict(RuntimeError("boom"), "demo-1") is None
    assert pgcode_of(RuntimeError("boom")) is None


def test_causa_aninhada_e_encontrada() -> None:
    wrapped = ValueError("camada app")
    wrapped.__cause__ = _PgUniqueViolation()
    assert isinstance(translate_conflict(wrapped, "s"), SlugConflictError)
