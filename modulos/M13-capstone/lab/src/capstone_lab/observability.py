"""Observabilidade: traces estruturados, métricas, logs sanitizados e SLO (M13 B14).

Invariantes:
- Trace local em memória: spans com ``trace_id`` comum, pai/filho explícito e
  duração real medida com ``time.monotonic`` — nenhum valor inventado.
- Log é dict estruturado e passa por sanitização (segredos do B12 + e-mail/PII)
  antes de existir fora do processo.
- SLO é dado: ``error_budget = 1 - slo``; burn rate = taxa de erro observada ÷
  taxa de erro orçamentada. O alerta é derivado desse número, não de flag.
"""

from __future__ import annotations

import re
import time
import uuid
from dataclasses import dataclass, field

from .security import redact_secrets

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
SENSITIVE_KEYS = ("token", "secret", "password", "api_key", "email", "code")


@dataclass
class Span:
    name: str
    trace_id: str
    span_id: str
    parent_id: str | None
    start: float
    duration_ms: float | None = None
    status: str = "ok"
    attrs: dict[str, str] = field(default_factory=dict)


class Tracer:
    """Tracer em processo; ``spans`` é a saída exportável (stdout/arquivo)."""

    def __init__(self) -> None:
        self.spans: list[Span] = []

    def start(self, name: str, parent: Span | None = None, **attrs: str) -> Span:
        span = Span(
            name=name,
            trace_id=parent.trace_id if parent else uuid.uuid4().hex,
            span_id=uuid.uuid4().hex[:16],
            parent_id=parent.span_id if parent else None,
            start=time.monotonic(),
            attrs=attrs,
        )
        return span

    def end(self, span: Span, status: str = "ok") -> Span:
        span.duration_ms = round((time.monotonic() - span.start) * 1000, 3)
        span.status = status
        self.spans.append(span)
        return span


def sanitize_log(record: dict[str, str]) -> dict[str, str]:
    """Remove/redaz PII e segredos antes da saída; chave sensível = removida."""
    clean: dict[str, str] = {}
    for key, value in record.items():
        if any(s in key.lower() for s in SENSITIVE_KEYS):
            clean[key] = "[REDACTED]"
        else:
            clean[key] = redact_secrets(EMAIL_RE.sub("[EMAIL]", value))
    return clean


class Metrics:
    """Contadores e histograma local com percentil exato sobre amostra real."""

    def __init__(self) -> None:
        self.counters: dict[str, int] = {}
        self.samples: dict[str, list[float]] = {}

    def inc(self, name: str, value: int = 1) -> None:
        self.counters[name] = self.counters.get(name, 0) + value

    def observe(self, name: str, value: float) -> None:
        self.samples.setdefault(name, []).append(value)

    def percentile(self, name: str, p: float) -> float:
        data = sorted(self.samples.get(name, []))
        if not data:
            raise ValueError(f"métrica sem amostras: {name}")
        idx = min(int(p / 100 * len(data)), len(data) - 1)
        return data[idx]


def error_rate(events: list[bool]) -> float:
    """Fração de erros; lista vazia é erro (sem dado ≠ 0% de erro)."""
    if not events:
        raise ValueError("sem eventos para calcular taxa")
    return sum(1 for ok in events if not ok) / len(events)


def burn_rate(events: list[bool], slo: float) -> float:
    """Burn rate = taxa de erro observada / taxa de erro orçamentada."""
    budget = 1.0 - slo
    if budget <= 0:
        raise ValueError("SLO deve ser < 1.0")
    return error_rate(events) / budget


def slo_alert(events: list[bool], slo: float, fast_burn: float = 2.0) -> str | None:
    """Retorna a mensagem de alerta quando o burn rate excede o limiar."""
    rate = burn_rate(events, slo)
    if rate >= fast_burn:
        return f"ALERTA fast-burn: burn rate {rate:.2f}x >= {fast_burn}x do budget"
    return None
