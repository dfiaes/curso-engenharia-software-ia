"""B8: gateway de modelos — mesma suíte no fake; erros/usage normalizados.

Adapters reais (OpenAI/Anthropic/locais) = BLOCKED: sem rede/credenciais
neste ambiente; registrado em RASTREABILIDADE, nenhuma chamada simulada.
"""

import pytest

from capstone_lab.models import (
    ErrorKind,
    FakeModelAdapter,
    ModelRequest,
    NormalizedError,
    with_retry_budget,
)

RETRYABLE = frozenset({ErrorKind.TIMEOUT, ErrorKind.RATE_LIMIT})

GATEWAY_SUITE: dict[str, str] = {
    "resuma parser": "O parser extrai símbolos.",
    "resuma grafo": "O grafo liga chamadas.",
}


def run_gateway_contract(gateway: FakeModelAdapter) -> None:
    """Contrato executável: serve para fake e para qualquer adapter futuro."""
    for prompt in GATEWAY_SUITE:
        resp = gateway.complete(ModelRequest(prompt=prompt))
        assert resp.content == GATEWAY_SUITE[prompt]
        assert resp.usage.input_tokens > 0
        assert resp.usage.cost_usd >= 0.0  # usage normalizado


def test_same_suite_runs_on_fake_adapter() -> None:
    gateway = FakeModelAdapter(script=GATEWAY_SUITE)
    run_gateway_contract(gateway)
    # determinismo do fake: mesma sequência de prompts registrada
    assert gateway.calls == list(GATEWAY_SUITE)


def test_usage_is_normalized_format() -> None:
    resp = FakeModelAdapter({"p": "r"}).complete(ModelRequest(prompt="p"))
    usage = resp.usage
    assert isinstance(usage.input_tokens, int)
    assert isinstance(usage.output_tokens, int)
    assert isinstance(usage.cost_usd, float)


def test_structured_output_parsed_and_validated() -> None:
    gateway = FakeModelAdapter({"quem chama?": '{"callers": ["a.py"]}'})
    resp = gateway.complete(ModelRequest(prompt="quem chama?", schema={"type": "object"}))
    assert resp.structured == {"callers": ["a.py"]}


def test_invalid_structured_output_is_normalized_error() -> None:
    gateway = FakeModelAdapter({"p": "isto não é json"})
    with pytest.raises(NormalizedError) as exc:
        gateway.complete(ModelRequest(prompt="p", schema={"type": "object"}))
    assert exc.value.kind == ErrorKind.INVALID_OUTPUT


def test_timeout_is_normalized_and_retryable() -> None:
    gateway = FakeModelAdapter({"p": "r"}, latency_s=10.0)
    wrapped = with_retry_budget(gateway, RETRYABLE)
    with pytest.raises(NormalizedError) as exc:
        wrapped(ModelRequest(prompt="p", timeout_s=0.0, max_retries=2))
    assert exc.value.kind == ErrorKind.BUDGET_EXCEEDED
    assert gateway.calls == ["p", "p", "p"]  # 1 + 2 retries, depois para


def test_non_retryable_error_is_not_retried() -> None:
    gateway = FakeModelAdapter({"p": "não-json"})
    wrapped = with_retry_budget(gateway, RETRYABLE)
    req = ModelRequest(prompt="p", schema={"type": "object"}, max_retries=5)
    with pytest.raises(NormalizedError) as exc:
        wrapped(req)
    assert exc.value.kind == ErrorKind.INVALID_OUTPUT
    assert gateway.calls == ["p"]  # erro não-retryable: zero retries desperdiçados


def test_domain_types_do_not_import_vendor_sdks() -> None:
    from pathlib import Path

    import capstone_lab.models as m

    src = Path(m.__file__ or "").read_text(encoding="utf-8")
    for sdk in ("openai", "anthropic", "boto3", "google.genai"):
        assert f"import {sdk}" not in src  # remover SDK não altera o domínio
