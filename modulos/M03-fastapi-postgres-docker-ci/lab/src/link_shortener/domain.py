"""Contratos de domínio do encurtador de links (lote B02).

Este módulo é puro: não importa framework HTTP, driver de banco nem
settings. Ele existe para que as regras de slug e conflito sejam testadas
sem nenhum serviço externo.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_SLUG_RE = re.compile(r"[A-Za-z0-9_-]{1,16}\Z")
_URL_PREFIXES = ("http://", "https://")

MAX_URL_LENGTH = 2048


@dataclass(frozen=True)
class LinkCreate:
    """Intenção de criar um link, já validada na fronteira."""

    slug: str
    url: str


class DomainError(ValueError):
    """Violação de regra de domínio (vira 422 na fronteira HTTP)."""


class SlugConflictError(DomainError):
    """O slug já existe (vira 409 na fronteira HTTP)."""


class LinkNotFoundError(DomainError):
    """O slug não existe (vira 404 na fronteira HTTP)."""


def validate_slug(raw: str) -> str:
    """Normaliza e valida um slug.

    Regra: 1-16 caracteres de ``[A-Za-z0-9_-]``. Espaço em branco nas
    bordas é removido; qualquer outro desvio levanta ``DomainError``.
    """
    slug = raw.strip()
    if not _SLUG_RE.fullmatch(slug):
        raise DomainError(f"slug inválido: {raw!r} (use 1-16 caracteres de A-Z, 0-9, - ou _)")
    return slug


def validate_url(raw: str) -> str:
    """Valida a URL de destino (http/https, até 2048 caracteres)."""
    url = raw.strip()
    if len(url) > MAX_URL_LENGTH:
        raise DomainError(f"url excede {MAX_URL_LENGTH} caracteres")
    if not url.startswith(_URL_PREFIXES):
        raise DomainError(f"url deve começar com http:// ou https://: {raw!r}")
    return url


def make_link(slug: str, url: str) -> LinkCreate:
    """Constrói a intenção de criação após validar as duas pontas."""
    return LinkCreate(slug=validate_slug(slug), url=validate_url(url))
