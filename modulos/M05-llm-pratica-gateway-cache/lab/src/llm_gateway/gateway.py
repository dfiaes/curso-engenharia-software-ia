"""Gateway: roteamento, retry com teto, timeout, cache e custo (lote M05).

Ordem por chamada: cache → primário (com retry e timeout) → fallback
(uma vez) → ledger + telemetria. Retry storm é impossível por construção:
o total de tentativas é limitado (`max_retries` no primário + 1 fallback),
não há espera implícita e cada tentativa tem timeout próprio.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from llm_gateway.cache import ExactCache
from llm_gateway.contract import (
    ChatRequest,
    ChatResponse,
    Provider,
    ProviderError,
    ProviderTimeout,
)
from llm_gateway.prices import cost_usd


@dataclass(slots=True)
class CallRecord:
    model_used: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    cached: bool = False
    fallback_used: bool = False
    price_model: str = "classe-rapida"


@dataclass(slots=True)
class CostLedger:
    records: list[CallRecord] = field(default_factory=list)

    def add(self, record: CallRecord) -> None:
        self.records.append(record)

    def total_usd(self) -> float:
        return sum(cost_usd(r.price_model, r.input_tokens, r.output_tokens) for r in self.records)

    def report(self) -> str:
        """Relatório em markdown: top requests e economia do cache."""
        lines = ["# Relatório de custo", "", f"chamadas: {len(self.records)}"]
        total = self.total_usd()
        lines.append(f"custo total: USD {total:.6f}")
        cached = sum(1 for r in self.records if r.cached)
        lines.append(f"hits de cache: {cached}")
        lines += ["", "| # | modelo | in | out | USD | cache |", "|---|---|---|---|---|---|---|"]
        for i, r in enumerate(self.records, start=1):
            lines.append(
                f"| {i} | {r.model_used} | {r.input_tokens} | {r.output_tokens} "
                f"| {cost_usd(r.price_model, r.input_tokens, r.output_tokens):.6f} "
                f"| {'sim' if r.cached else 'não'} |"
            )
        return "\n".join(lines) + "\n"


class Gateway:
    """Roteador com resiliência e contabilidade (AT-013..017)."""

    def __init__(
        self,
        primary: Provider,
        fallback: Provider,
        cache: ExactCache | None = None,
        timeout_s: float = 10.0,
        max_retries: int = 1,
        ledger: CostLedger | None = None,
        price_model: str = "classe-rapida",
    ) -> None:
        self._primary = primary
        self._fallback = fallback
        self._cache = cache
        self._timeout_s = timeout_s
        self._max_retries = max_retries
        self._ledger = ledger or CostLedger()
        self._price_model = price_model

    @property
    def ledger(self) -> CostLedger:
        return self._ledger

    async def _call_once(self, provider: Provider, request: ChatRequest) -> ChatResponse:
        try:
            return await asyncio.wait_for(provider.complete(request), self._timeout_s)
        except TimeoutError as exc:
            raise ProviderTimeout(f"{provider.name} estourou {self._timeout_s}s") from exc

    async def complete(self, request: ChatRequest) -> ChatResponse:
        """Executa com cache, retry tetado, fallback único e ledger."""
        if self._cache is not None:
            hit = self._cache.get(request)
            if hit is not None:
                self._ledger.add(
                    CallRecord(
                        hit.model,
                        hit.input_tokens,
                        hit.output_tokens,
                        0.0,
                        cached=True,
                        price_model=self._price_model,
                    )
                )
                return hit
        for _ in range(self._max_retries + 1):
            try:
                response = await self._call_once(self._primary, request)
                return self._record(request, response, fallback_used=False)
            except ProviderError:
                continue
        try:
            response = await self._call_once(self._fallback, request)
        except ProviderError:
            raise
        return self._record(request, response, fallback_used=True)

    def _record(
        self, request: ChatRequest, response: ChatResponse, *, fallback_used: bool
    ) -> ChatResponse:
        if self._cache is not None:
            self._cache.put(request, response)
        self._ledger.add(
            CallRecord(
                response.model,
                response.input_tokens,
                response.output_tokens,
                response.latency_ms,
                fallback_used=fallback_used,
                price_model=self._price_model,
            )
        )
        return response
