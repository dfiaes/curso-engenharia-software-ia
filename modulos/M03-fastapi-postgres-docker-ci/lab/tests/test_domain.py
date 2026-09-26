"""Contrato de slug e URL (AT-001/AT-002 no nível de domínio).

Estes oráculos rodam sem banco, container ou rede: provam a fronteira
de validação que a rota HTTP usa antes de tocar a persistência.
"""

import pytest

from link_shortener.domain import DomainError, make_link, validate_slug, validate_url


def test_slug_valido_passa() -> None:
    assert validate_slug("abc123") == "abc123"
    assert validate_slug("  demo-1_x  ") == "demo-1_x"


@pytest.mark.parametrize("raw", ["", "tem espaço", "slug/muito/longo/para/16", "çãõ", "a" * 17])
def test_slug_invalido_levanta(raw: str) -> None:
    with pytest.raises(DomainError):
        validate_slug(raw)


def test_url_exige_http() -> None:
    assert validate_url("https://exemplo.com/x") == "https://exemplo.com/x"
    with pytest.raises(DomainError):
        validate_url("ftp://exemplo.com/x")
    with pytest.raises(DomainError):
        validate_url("sem-esquema")


def test_make_link_rejeita_qualquer_ponta_invalida() -> None:
    with pytest.raises(DomainError):
        make_link("ok-1", "ftp://x.com")
    with pytest.raises(DomainError):
        make_link("não vale", "https://x.com")
    link = make_link("ok-1", "https://x.com/a")
    assert (link.slug, link.url) == ("ok-1", "https://x.com/a")
