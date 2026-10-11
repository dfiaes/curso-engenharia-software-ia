"""Experimentos locais de paralelismo e estado compartilhado.

Os relatórios preservam observações do ambiente e resultados determinísticos. Tempos
servem para formular hipóteses locais; a API deliberadamente não declara vencedor.
"""

from __future__ import annotations

import concurrent.futures
import hashlib
import multiprocessing
import os
import platform
import queue
import statistics
import sys
import sysconfig
import threading
import time
from collections.abc import Callable, Iterable, Sequence
from dataclasses import asdict, dataclass
from typing import Any, Literal, cast


@dataclass(frozen=True, slots=True)
class RuntimeCapabilities:
    implementation: str
    version: str
    free_threaded_build: bool
    gil_enabled: bool | None
    interpreter_pool_available: bool
    cpu_count: int | None
    process_start_method: str


@dataclass(frozen=True, slots=True)
class ExecutorObservation:
    """Uma observação honesta: disponível, indisponível ou erro de execução."""

    status: Literal["available", "unavailable", "error"]
    samples_ms: tuple[float, ...]
    median_ms: float | None
    result_hash: str | None
    reason: str | None


@dataclass(frozen=True, slots=True)
class CpuComparisonReport:
    capabilities: RuntimeCapabilities
    workload_id: str
    input_hash: str
    expected_result_hash: str
    jobs: int
    rounds_per_job: int
    warmups: int
    samples: int
    executors: dict[str, ExecutorObservation]


@dataclass(frozen=True, slots=True)
class SharedCounterReport:
    workers: int
    expected: int
    race_observed: int
    race_reads: tuple[int, ...]
    lock_observed: int
    message_passing_observed: int

    @property
    def lost_updates(self) -> int:
        return self.expected - self.race_observed


def runtime_capabilities() -> RuntimeCapabilities:
    gil_enabled_fn = getattr(sys, "_is_gil_enabled", None)
    gil_enabled = bool(gil_enabled_fn()) if callable(gil_enabled_fn) else None
    return RuntimeCapabilities(
        implementation=platform.python_implementation(),
        version=platform.python_version(),
        free_threaded_build=bool(sysconfig.get_config_var("Py_GIL_DISABLED") or 0),
        gil_enabled=gil_enabled,
        interpreter_pool_available=hasattr(concurrent.futures, "InterpreterPoolExecutor"),
        cpu_count=os.cpu_count(),
        process_start_method=multiprocessing.get_context().get_start_method(),
    )


def benchmark_local(
    operation: Callable[[], object], *, warmups: int = 1, samples: int = 5
) -> dict[str, Any]:
    """Mede uma operação local sem transformar tempo em promessa portátil."""

    if warmups < 0 or samples < 1:
        raise ValueError("warmups >= 0 e samples >= 1")
    for _ in range(warmups):
        operation()
    durations_ms: list[float] = []
    for _ in range(samples):
        start = time.perf_counter_ns()
        operation()
        durations_ms.append((time.perf_counter_ns() - start) / 1_000_000)
    ordered = sorted(durations_ms)
    p95_index = min(len(ordered) - 1, int(0.95 * len(ordered)))
    return {
        "environment": asdict(runtime_capabilities()),
        "warmups": warmups,
        "samples": samples,
        "durations_ms": durations_ms,
        "median_ms": statistics.median(durations_ms),
        "p95_ms": ordered[p95_index],
    }


def _stable_hash(parts: Iterable[str]) -> str:
    digest = hashlib.sha256()
    for part in parts:
        encoded = part.encode("ascii")
        digest.update(len(encoded).to_bytes(8, "big"))
        digest.update(encoded)
    return digest.hexdigest()


def _cpu_digest(work: tuple[int, int]) -> str:
    """Workload puro e serializável, compartilhado por todos os executores."""

    seed, rounds = work
    value = hashlib.sha256(seed.to_bytes(8, "big", signed=False)).digest()
    for round_number in range(rounds):
        value = hashlib.sha256(value + round_number.to_bytes(8, "big")).digest()
    return value.hex()


def _measure_operation(
    operation: Callable[[], Sequence[str]],
    *,
    expected_result_hash: str,
    warmups: int,
    samples: int,
) -> ExecutorObservation:
    for _ in range(warmups):
        warmup_hash = _stable_hash(operation())
        if warmup_hash != expected_result_hash:
            return ExecutorObservation(
                status="error",
                samples_ms=(),
                median_ms=None,
                result_hash=warmup_hash,
                reason="resultado divergente durante warm-up",
            )

    durations_ms: list[float] = []
    result_hash: str | None = None
    for _ in range(samples):
        started = time.perf_counter_ns()
        observed_hash = _stable_hash(operation())
        durations_ms.append((time.perf_counter_ns() - started) / 1_000_000)
        if observed_hash != expected_result_hash:
            return ExecutorObservation(
                status="error",
                samples_ms=tuple(durations_ms),
                median_ms=statistics.median(durations_ms),
                result_hash=observed_hash,
                reason="resultado divergente do baseline sequencial",
            )
        result_hash = observed_hash

    return ExecutorObservation(
        status="available",
        samples_ms=tuple(durations_ms),
        median_ms=statistics.median(durations_ms),
        result_hash=result_hash,
        reason=None,
    )


def _observe_pool(
    factory: Callable[[], concurrent.futures.Executor],
    work_items: tuple[tuple[int, int], ...],
    *,
    expected_result_hash: str,
    warmups: int,
    samples: int,
) -> ExecutorObservation:
    try:
        with factory() as executor:
            return _measure_operation(
                lambda: tuple(executor.map(_cpu_digest, work_items)),
                expected_result_hash=expected_result_hash,
                warmups=warmups,
                samples=samples,
            )
    except Exception as error:  # relatório deve preservar falha de capability/runtime
        return ExecutorObservation(
            status="error",
            samples_ms=(),
            median_ms=None,
            result_hash=None,
            reason=f"{type(error).__name__}: {error}",
        )


def _new_interpreter_pool(max_workers: int) -> concurrent.futures.Executor:
    pool_type = getattr(concurrent.futures, "InterpreterPoolExecutor", None)
    if pool_type is None:
        raise RuntimeError("InterpreterPoolExecutor ausente neste runtime")
    constructor = cast(Callable[..., concurrent.futures.Executor], pool_type)
    return constructor(max_workers=max_workers)


def compare_cpu_executors(
    *,
    jobs: int = 4,
    rounds_per_job: int = 2_000,
    warmups: int = 1,
    samples: int = 3,
    max_workers: int = 2,
) -> CpuComparisonReport:
    """Executa o mesmo workload em quatro estratégias sem produzir ranking fixo.

    Processos e subinterpreters recebem apenas uma função de módulo e tuplas simples,
    tornando serialização e isolamento parte explícita do experimento.
    """

    if jobs < 1 or rounds_per_job < 1 or max_workers < 1:
        raise ValueError("jobs, rounds_per_job e max_workers devem ser >= 1")
    if warmups < 0 or samples < 1:
        raise ValueError("warmups >= 0 e samples >= 1")

    work_items = tuple((seed, rounds_per_job) for seed in range(jobs))
    input_hash = _stable_hash(f"{seed}:{rounds}" for seed, rounds in work_items)
    baseline_results = tuple(_cpu_digest(item) for item in work_items)
    expected_result_hash = _stable_hash(baseline_results)

    loop_observation = _measure_operation(
        lambda: tuple(_cpu_digest(item) for item in work_items),
        expected_result_hash=expected_result_hash,
        warmups=warmups,
        samples=samples,
    )
    thread_observation = _observe_pool(
        lambda: concurrent.futures.ThreadPoolExecutor(max_workers=max_workers),
        work_items,
        expected_result_hash=expected_result_hash,
        warmups=warmups,
        samples=samples,
    )
    process_observation = _observe_pool(
        lambda: concurrent.futures.ProcessPoolExecutor(max_workers=max_workers),
        work_items,
        expected_result_hash=expected_result_hash,
        warmups=warmups,
        samples=samples,
    )

    capabilities = runtime_capabilities()
    if capabilities.interpreter_pool_available:
        interpreter_observation = _observe_pool(
            lambda: _new_interpreter_pool(max_workers),
            work_items,
            expected_result_hash=expected_result_hash,
            warmups=warmups,
            samples=samples,
        )
    else:
        interpreter_observation = ExecutorObservation(
            status="unavailable",
            samples_ms=(),
            median_ms=None,
            result_hash=None,
            reason="InterpreterPoolExecutor não está disponível neste runtime",
        )

    return CpuComparisonReport(
        capabilities=capabilities,
        workload_id="iterated-sha256-v1",
        input_hash=input_hash,
        expected_result_hash=expected_result_hash,
        jobs=jobs,
        rounds_per_job=rounds_per_job,
        warmups=warmups,
        samples=samples,
        executors={
            "loop": loop_observation,
            "thread_pool": thread_observation,
            "process_pool": process_observation,
            "interpreter_pool": interpreter_observation,
        },
    )


def demonstrate_shared_counter(*, workers: int = 4) -> SharedCounterReport:
    """Força read-yield-write e compara lock com ownership por mensagens.

    A barreira faz todos os workers lerem antes de qualquer escrita. Assim a perda de
    update é consequência do protocolo defeituoso, não de sorte do scheduler ou do GIL.
    """

    if workers < 2:
        raise ValueError("workers deve ser >= 2 para demonstrar a corrida")

    race_state = {"value": 0}
    read_barrier = threading.Barrier(workers)

    def racy_increment() -> int:
        observed = race_state["value"]
        read_barrier.wait()
        race_state["value"] = observed + 1
        return observed

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        race_reads = tuple(executor.map(lambda _: racy_increment(), range(workers)))

    locked_state = {"value": 0}
    state_lock = threading.Lock()

    def locked_increment() -> None:
        with state_lock:
            locked_state["value"] += 1

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        tuple(executor.map(lambda _: locked_increment(), range(workers)))

    messages: queue.SimpleQueue[int] = queue.SimpleQueue()

    def send_increment() -> None:
        messages.put(1)

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        tuple(executor.map(lambda _: send_increment(), range(workers)))
    message_passing_observed = sum(messages.get() for _ in range(workers))

    return SharedCounterReport(
        workers=workers,
        expected=workers,
        race_observed=race_state["value"],
        race_reads=race_reads,
        lock_observed=locked_state["value"],
        message_passing_observed=message_passing_observed,
    )
