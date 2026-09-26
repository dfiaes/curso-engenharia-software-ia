"""Saída estruturada: forma imposta, verdade não garantida (AT-004/005/006)."""

from __future__ import annotations

import pytest
from pydantic import BaseModel

from llm_gateway.structured import Abstention, StructuredError, parse_output


class LinkExtraido(BaseModel):
    model_config = {"frozen": True}

    slug: str
    url: str


def test_json_valido_vira_objeto() -> None:
    link = parse_output('{"slug": "a-1", "url": "https://x.com"}', LinkExtraido)
    assert (link.slug, link.url) == ("a-1", "https://x.com")


def test_json_invalido_vira_erro_tipado() -> None:
    with pytest.raises(StructuredError, match="não é JSON"):
        parse_output('{"slug": ', LinkExtraido)


def test_fora_do_schema_e_rejeitado() -> None:
    with pytest.raises(StructuredError, match="fora do schema"):
        parse_output('{"slug": "a-1"}', LinkExtraido)
    with pytest.raises(StructuredError, match="fora do schema"):
        parse_output('{"slug": "a-1", "url": 42}', LinkExtraido)


def test_abstencao_e_saida_valida() -> None:
    saida = parse_output('{"abstained": true, "reason": "sem contexto"}', Abstention)
    assert saida.abstained is True
