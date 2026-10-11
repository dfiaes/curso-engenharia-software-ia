import asyncio
import io
import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import InMemoryMetricReader

from llm_service.app import RequestStats, create_app, sse_events
from llm_service.config import Settings, load_settings
from llm_service.llm import FakeLLM, LLMError, LLMUnavailable
from llm_service.metrics import Instruments


def make(
    llm: FakeLLM | None = None, **env: str
) -> tuple[TestClient, io.StringIO, InMemoryMetricReader, FakeLLM]:
    settings: Settings = load_settings(env)
    fake = llm or FakeLLM()
    reader = InMemoryMetricReader()
    meter = MeterProvider(metric_readers=[reader]).get_meter("test")
    stream = io.StringIO()
    app = create_app(settings, llm=fake, meter=meter, log_stream=stream)
    return TestClient(app), stream, reader, fake


@pytest.fixture
def client() -> Iterator[TestClient]:
    c, *_ = make()
    with c:
        yield c


def log_lines(stream: io.StringIO) -> list[dict[str, object]]:
    return [json.loads(line) for line in stream.getvalue().splitlines() if line]


def test_health_and_ready(client: TestClient) -> None:
    assert client.get("/healthz").json() == {"status": "ok"}
    r = client.get("/readyz")
    assert r.status_code == 200 and r.json()["backend"] == "fake"


def test_not_ready_is_503_but_health_stays_ok() -> None:
    c, *_ = make(FakeLLM(is_ready=False))
    with c:
        assert c.get("/readyz").status_code == 503
        assert c.get("/healthz").status_code == 200


def test_complete_happy_path_and_request_id(client: TestClient) -> None:
    r = client.post("/v1/complete", json={"prompt": "olá mundo"}, headers={"x-request-id": "abc-1"})
    body = r.json()
    assert r.status_code == 200
    assert body["text"] == "eco: olá mundo"
    assert body["usage"] == {"input_tokens": 2, "output_tokens": 3}
    assert body["request_id"] == "abc-1" and r.headers["x-request-id"] == "abc-1"


def test_hostile_request_id_is_replaced(client: TestClient) -> None:
    r = client.post("/v1/complete", json={"prompt": "x"}, headers={"x-request-id": "a b\tc;rm"})
    assert r.headers["x-request-id"] != "a b\tc;rm"
    assert len(r.headers["x-request-id"]) == 32


def test_empty_prompt_is_422_and_oversize_is_413() -> None:
    c, *_ = make(MAX_PROMPT_CHARS="10")
    with c:
        assert c.post("/v1/complete", json={"prompt": ""}).status_code == 422
        r = c.post("/v1/complete", json={"prompt": "x" * 11})
        assert r.status_code == 413
        assert r.headers["content-type"] == "application/problem+json"


def test_unavailable_maps_to_503_with_retry_after() -> None:
    c, stream, reader, _ = make(FakeLLM(fail_with=LLMUnavailable("429", retry_after_s=7)))
    with c:
        r = c.post("/v1/complete", json={"prompt": "oi"})
    assert r.status_code == 503 and r.headers["retry-after"] == "7"
    assert log_lines(stream)[-1]["error"] == "unavailable"
    names = metric_names(reader)
    assert "llm_service.upstream.errors" in names


def test_upstream_error_maps_to_502_without_leaking_detail() -> None:
    c, *_ = make(FakeLLM(fail_with=LLMError("segredo interno xyz")))
    with c:
        r = c.post("/v1/complete", json={"prompt": "oi"})
    assert r.status_code == 502 and "xyz" not in r.text


def metric_names(reader: InMemoryMetricReader) -> set[str]:
    data = reader.get_metrics_data()
    if data is None:
        return set()
    return {m.name for rm in data.resource_metrics for sm in rm.scope_metrics for m in sm.metrics}


def test_access_log_has_tokens_and_never_the_prompt() -> None:
    c, stream, reader, _ = make()
    with c:
        c.post("/v1/complete", json={"prompt": "dado sensivel 123"})
    entry = log_lines(stream)[-1]
    assert entry["input_tokens"] == 3 and entry["output_tokens"] == 4
    assert entry["model"] == "fake-echo" and entry["status"] == 200
    assert "sensivel" not in stream.getvalue()
    assert {"gen_ai.client.token.usage", "gen_ai.client.operation.duration"} <= metric_names(reader)


def test_stream_emits_tokens_then_done() -> None:
    c, stream, *_ = make()
    with c:
        r = c.post("/v1/stream", json={"prompt": "a b"})
    assert r.headers["content-type"].startswith("text/event-stream")
    assert r.text.count("event: token") == 3
    assert r.text.rstrip().endswith('"output_tokens": 3}}')
    entry = log_lines(stream)[-1]
    assert "ttft_ms" in entry and entry["output_tokens"] == 3


def test_stream_failure_becomes_error_event() -> None:
    c, *_ = make(FakeLLM(fail_with=LLMUnavailable("503")))
    with c:
        r = c.post("/v1/stream", json={"prompt": "a b"})
    assert "event: error" in r.text and '"status": 503' in r.text


def test_keepalive_comment_when_provider_is_slow() -> None:
    async def run() -> list[str]:
        llm = FakeLLM(delay_s=0.2)
        reader = InMemoryMetricReader()
        instruments = Instruments(MeterProvider(metric_readers=[reader]).get_meter("t"))
        events = sse_events(
            llm, "a", keepalive_s=0.05, stats=RequestStats("r"), instruments=instruments
        )
        out = [e async for e in events]
        return out

    out = asyncio.run(run())
    assert ": keepalive\n\n" in out
    assert any(e.startswith("event: done") for e in out)


def test_client_disconnect_cancels_the_upstream_stream() -> None:
    async def run() -> FakeLLM:
        llm = FakeLLM(delay_s=0.05)
        instruments = Instruments(MeterProvider().get_meter("t"))
        gen = sse_events(
            llm,
            "um dois tres quatro",
            keepalive_s=5,
            stats=RequestStats("r"),
            instruments=instruments,
        )
        first = await anext(gen)
        assert first.startswith("event: token")
        await gen.aclose()  # o que o servidor faz quando o cliente some
        await asyncio.sleep(0.05)
        return llm

    assert asyncio.run(run()).stream_cancelled is True


def test_lifespan_closes_provider_client() -> None:
    c, _, _, fake = make()
    with c:
        pass
    assert fake.closed is True
