"""The three cases of module E01, as executable estimates.

All prices are hypothetical round numbers (USD per million tokens). The point is the
arithmetic and the order of magnitude, not a quote from any provider.
"""

from __future__ import annotations

from dataclasses import dataclass

from capacity.core import (
    Price,
    Tokens,
    Traffic,
    agent_task_tokens,
    cascade_cost,
    drain_minutes,
    generation_latency,
    littles_law,
    monthly_cost,
    quota_needed,
    request_cost,
    routed_cost,
    sample_size,
    vector_storage_bytes,
    workers_needed,
)

LARGE = Price(input_per_mtok=3.00, output_per_mtok=15.00)
SMALL = Price(input_per_mtok=0.25, output_per_mtok=1.25)
STEPS = 10


@dataclass(frozen=True)
class Row:
    key: str
    label: str
    value: float
    unit: str


@dataclass(frozen=True)
class Report:
    title: str
    rows: tuple[Row, ...]

    def value(self, key: str) -> float:
        for row in self.rows:
            if row.key == key:
                return row.value
        raise KeyError(key)

    def render(self) -> str:
        width = max(len(row.label) for row in self.rows)
        lines = [f"== {self.title} =="]
        lines += [
            f"{row.label:<{width}}  {_fmt(row.value)} {row.unit}".rstrip() for row in self.rows
        ]
        return "\n".join(lines)


def _fmt(value: float) -> str:
    if float(value).is_integer():
        return f"{value:_.0f}"
    if abs(value) >= 100:
        return f"{value:_.0f}"
    if abs(value) >= 1:
        return f"{value:.2f}"
    return f"{value:.4f}"


def case1_rag_assistant() -> Report:
    """Support assistant with RAG for 10,000 daily active users."""
    traffic = Traffic(active_users=10_000, requests_per_user_day=5, active_hours=10, peak_factor=3)
    tokens = Tokens(input=3_500, output=350)
    retrieval_s = 0.4
    gen_s = generation_latency(ttft_s=0.8, output_tokens=tokens.output, tokens_per_s=60)
    total_s = retrieval_s + gen_s
    in_flight = littles_law(traffic.peak_qps, total_s)
    quota = quota_needed(traffic.peak_qps, tokens, headroom=0.3)

    large = request_cost(tokens, LARGE)
    small = request_cost(tokens, SMALL)
    base = monthly_cost(traffic.requests_per_day, large)
    cached = monthly_cost(traffic.requests_per_day, large, cache_hit_rate=0.2)
    mixed = routed_cost(small, large, small_share=0.5)
    routed = monthly_cost(traffic.requests_per_day, mixed, cache_hit_rate=0.2)

    judge = request_cost(Tokens(input=4_000, output=200), LARGE)
    judge_month = monthly_cost(traffic.requests_per_day * 0.05, judge)
    index_bytes = vector_storage_bytes(400_000, 1_024)
    return Report(
        "Caso 1: assistente de suporte com RAG",
        (
            Row("requests_day", "requisicoes por dia", traffic.requests_per_day, ""),
            Row("avg_qps", "QPS medio na janela", traffic.average_qps, "req/s"),
            Row("peak_qps", "QPS de pico (3x)", traffic.peak_qps, "req/s"),
            Row("latency", "latencia ate o ultimo token", total_s, "s"),
            Row("in_flight", "requisicoes em voo no pico (Little)", in_flight, ""),
            Row("rpm", "cota RPM com 30% de folga", quota.rpm, "req/min"),
            Row("tpm", "cota TPM com 30% de folga", quota.tpm, "tokens/min"),
            Row("cost_large", "custo por requisicao, modelo grande", large, "USD"),
            Row("cost_base", "custo mensal sem otimizacao", base, "USD"),
            Row("cost_cache", "custo mensal com 20% de acerto de cache", cached, "USD"),
            Row("cost_routed", "custo mensal com cache e 50% no modelo pequeno", routed, "USD"),
            Row(
                "judge_month", "avaliacao online: juiz em 5% das respostas", judge_month, "USD/mes"
            ),
            Row("index_gb", "indice vetorial (400 mil chunks, 1024 dim)", index_bytes / 1e9, "GB"),
        ),
    )


def case2_agent_platform() -> Report:
    """Platform that runs agent tasks against third-party systems."""
    traffic = Traffic(active_users=2_000, requests_per_user_day=10, active_hours=12, peak_factor=3)
    tokens = agent_task_tokens(
        steps=10, base_context=3_000, growth_per_step=800, output_per_step=300
    )
    wall_s = 10 * (8 + 3)
    in_flight = littles_law(traffic.peak_qps, wall_s)
    workers = workers_needed(in_flight, target_utilization=0.7)
    quota = quota_needed(traffic.peak_qps, tokens, headroom=0.3)
    # every task makes one model call per step: RPM counts calls, not tasks
    calls_rpm = quota_needed(traffic.peak_qps * STEPS, Tokens(0, 0), headroom=0.3).rpm

    plain = request_cost(tokens, LARGE)
    cached = request_cost(tokens, LARGE, cached_input_fraction=0.85)
    month_plain = monthly_cost(traffic.requests_per_day, plain)
    month_cached = monthly_cost(traffic.requests_per_day, cached)

    compact = agent_task_tokens(
        steps=10, base_context=3_000, growth_per_step=400, output_per_step=300
    )
    compact_cost = request_cost(compact, LARGE, cached_input_fraction=0.85)
    long_task = agent_task_tokens(
        steps=25, base_context=3_000, growth_per_step=800, output_per_step=300
    )
    long_cost = request_cost(long_task, LARGE, cached_input_fraction=0.85)
    return Report(
        "Caso 2: plataforma de agentes",
        (
            Row("tasks_day", "tarefas por dia", traffic.requests_per_day, ""),
            Row("peak_tps", "tarefas por segundo no pico (3x)", traffic.peak_qps, "tarefas/s"),
            Row("task_in", "tokens de entrada por tarefa (10 passos)", tokens.input, "tokens"),
            Row("task_out", "tokens de saida por tarefa", tokens.output, "tokens"),
            Row("wall", "duracao de uma tarefa", wall_s, "s"),
            Row("in_flight", "tarefas simultaneas no pico (Little)", in_flight, ""),
            Row("workers", "workers a 70% de utilizacao", workers, ""),
            Row("rpm", "cota RPM (chamadas ao modelo) com 30% de folga", calls_rpm, "req/min"),
            Row("tpm", "cota TPM com 30% de folga", quota.tpm, "tokens/min"),
            Row("task_cost_plain", "custo por tarefa, sem cache de prefixo", plain, "USD"),
            Row("task_cost_cached", "custo por tarefa, 85% do prefixo em cache", cached, "USD"),
            Row("month_plain", "custo mensal sem cache", month_plain, "USD"),
            Row("month_cached", "custo mensal com cache de prefixo", month_cached, "USD"),
            Row(
                "task_cost_compact", "custo por tarefa com contexto compactado", compact_cost, "USD"
            ),
            Row("task_cost_25", "custo de uma tarefa longa (25 passos)", long_cost, "USD"),
        ),
    )


def case3_document_batch() -> Report:
    """One-off backlog of 1.2 million pages processed in batch."""
    pages = 1_200_000
    tokens = Tokens(input=2_200, output=600)
    small = request_cost(tokens, SMALL)
    large = request_cost(tokens, LARGE)
    escalation = 0.12
    cascade = cascade_cost(small, large, escalation)
    sync_large = pages * large
    sync_cascade = pages * cascade
    batch_cascade = monthly_cost(pages, cascade, batch_share=1.0, batch_discount=0.5, days=1)

    total_tokens = pages * tokens.total * (1 + escalation)
    drain_h = drain_minutes(total_tokens, tpm=1_000_000) / 60
    deadline_min = 7 * 24 * 60
    needed_tpm = total_tokens / deadline_min

    per_lot = sample_size(expected_rate=0.05, margin=0.01)
    lots = pages // 100_000
    review_pages = per_lot * lots
    return Report(
        "Caso 3: pipeline de documentos em lote",
        (
            Row("pages", "paginas no backlog", pages, ""),
            Row("cost_small", "custo por pagina, modelo pequeno", small, "USD"),
            Row("cost_large", "custo por pagina, modelo grande", large, "USD"),
            Row(
                "cost_cascade",
                "custo medio por pagina, cascata com 12% de escalonamento",
                cascade,
                "USD",
            ),
            Row("total_sync_large", "total: tudo no modelo grande, sincrono", sync_large, "USD"),
            Row("total_sync_cascade", "total: cascata, sincrono", sync_cascade, "USD"),
            Row(
                "total_batch_cascade",
                "total: cascata, batch com 50% de desconto",
                batch_cascade,
                "USD",
            ),
            Row("tokens_total", "tokens totais (com reprocessamento)", total_tokens, "tokens"),
            Row("drain_hours", "tempo a 1M TPM (modo sincrono)", drain_h, "h"),
            Row("tpm_deadline", "TPM minimo para terminar em 7 dias", needed_tpm, "tokens/min"),
            Row("sample_lot", "amostra por lote de 100 mil paginas (5% +-1pp)", per_lot, "paginas"),
            Row(
                "review_pages", "paginas revisadas por humanos (12 lotes)", review_pages, "paginas"
            ),
            Row("review_hours", "horas de revisao a 60 paginas/h", review_pages / 60, "h"),
        ),
    )


ALL_CASES = (case1_rag_assistant, case2_agent_platform, case3_document_batch)
