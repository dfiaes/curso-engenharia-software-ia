"""Instrumentos OpenTelemetry com nomes das convenções semânticas de GenAI."""

from opentelemetry.metrics import Counter, Histogram, Meter


class Instruments:
    def __init__(self, meter: Meter) -> None:
        self.tokens: Histogram = meter.create_histogram(
            "gen_ai.client.token.usage", unit="{token}", description="Tokens por chamada"
        )
        self.duration: Histogram = meter.create_histogram(
            "gen_ai.client.operation.duration", unit="s", description="Duração da chamada ao LLM"
        )
        self.upstream_errors: Counter = meter.create_counter(
            "llm_service.upstream.errors", unit="{error}", description="Falhas do provedor"
        )

    def record_call(
        self, model: str, input_tokens: int, output_tokens: int, seconds: float
    ) -> None:
        base = {"gen_ai.operation.name": "chat", "gen_ai.request.model": model}
        self.tokens.record(input_tokens, {**base, "gen_ai.token.type": "input"})
        self.tokens.record(output_tokens, {**base, "gen_ai.token.type": "output"})
        self.duration.record(seconds, base)

    def record_error(self, model: str, kind: str) -> None:
        self.upstream_errors.add(1, {"gen_ai.request.model": model, "error.kind": kind})
