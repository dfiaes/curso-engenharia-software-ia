"""Oraculos AT-024-028: knobs, host/auth e provider sobre transporte fake.

Sem servidor, sem rede, sem Docker. O transporte fake devolve usage +
logprobs fixos; o adapter prova preservacao de contagem, custo 0.0 e
forca de num_ctx/keep_alive no corpo enviado.
"""

from collections.abc import Mapping
from typing import Any

import pytest

from provedor_local import (
    ConfigOllama,
    OllamaProvider,
    Uso,
    politica_host,
    validar_local,
)


def _fake_ok(url: str, corpo: Mapping[str, Any]) -> Mapping[str, Any]:
    assert url.endswith("/chat/completions")
    assert corpo["options"] == {"num_ctx": 8192}
    assert corpo["keep_alive"] == "5m"
    return {"text": "ok", "usage": {"prompt": 10, "completion": 5}, "logprobs": [-0.1, -0.2]}


def test_ctx_curto_acusa_truncamento() -> None:
    """AT-024: n_ctx abaixo do prompt lista o erro de truncamento."""
    cfg = ConfigOllama(n_ctx=4096)
    erros = validar_local(cfg, 20000)
    assert any("truncado" in e for e in erros)
    assert validar_local(ConfigOllama(n_ctx=32768), 20000) == []


def test_paralelo_minimo_e_um() -> None:
    """AT-025: paralelo < 1 e invalido; >= 1 passa na validacao local."""
    assert any("paralelo" in e for e in validar_local(ConfigOllama(paralelo=0), 100))
    assert validar_local(ConfigOllama(paralelo=4), 100) == []


def test_keep_alive_exige_formato() -> None:
    """AT-026: keep_alive fora de -1/0/minutos e recusado; propagado no corpo."""
    assert validar_local(ConfigOllama(), 100) == []
    assert any("keep_alive" in e for e in validar_local(ConfigOllama(keep_alive="sempre"), 100))
    chamadas: list[dict[str, Any]] = []

    def espiar(url: str, corpo: Mapping[str, Any]) -> Mapping[str, Any]:
        chamadas.append(dict(corpo))
        return {"text": "ok", "usage": {}, "logprobs": []}

    provedor = OllamaProvider(ConfigOllama(keep_alive="-1"), espiar)
    provedor.completar([{"role": "user", "content": "oi"}])
    assert chamadas[0]["keep_alive"] == "-1"
    assert chamadas[0]["options"] == {"num_ctx": 8192}


def test_localhost_aprova_e_zero_zero_zero_zero_levanta() -> None:
    """AT-027: localhost passa; 0.0.0.0 sem proxy levanta; com proxy passa."""
    assert politica_host(ConfigOllama()) == "http://127.0.0.1:11434/v1"
    with pytest.raises(ValueError, match="proxy autenticado"):
        politica_host(ConfigOllama(host="0.0.0.0"))
    sem_exigencia = ConfigOllama(host="0.0.0.0", exige_auth_no_proxy=False)
    assert politica_host(sem_exigencia) == "http://0.0.0.0:11434/v1"


def test_fake_preserva_usage_logprobs_custo_zero() -> None:
    """AT-028: contagem preservada, custo 0.0, confianca = media."""
    r = OllamaProvider(ConfigOllama(), _fake_ok).completar([{"role": "user", "content": "ok?"}])
    assert r.texto == "ok"
    assert r.uso == Uso(entrada=10, saida=5, custo_usd=0.0)
    assert r.confianca == pytest.approx(-0.15)
    assert r.provedor == "ollama"
    assert r.modelo == "local-8b-q4"


def test_sem_logprobs_confianca_none() -> None:
    """AT-028 borda: usage sem logprobs rende confianca None, sem quebrar."""

    def sem_lp(url: str, corpo: Mapping[str, Any]) -> Mapping[str, Any]:
        return {"text": "x", "usage": {"prompt": 1, "completion": 1}}

    r = OllamaProvider(ConfigOllama(), sem_lp).completar([{"role": "user", "content": "x"}])
    assert r.confianca is None
    assert r.uso.custo_usd == 0.0
