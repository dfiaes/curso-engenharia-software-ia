import importlib

from python_senior_lab.parallelism import (
    benchmark_local,
    compare_cpu_executors,
    demonstrate_shared_counter,
    runtime_capabilities,
)


def test_capability_detection_reports_observation_not_assumption() -> None:
    capabilities = runtime_capabilities()

    assert capabilities.version.startswith("3.14")
    assert isinstance(capabilities.free_threaded_build, bool)
    assert capabilities.gil_enabled in (True, False, None)
    assert capabilities.cpu_count is None or capabilities.cpu_count >= 1
    assert capabilities.process_start_method


def test_native_extension_does_not_silently_change_the_gil_mode() -> None:
    before = runtime_capabilities().gil_enabled

    importlib.import_module("pydantic_core")

    assert runtime_capabilities().gil_enabled is before


def test_benchmark_records_environment_warmup_samples_and_distribution() -> None:
    report = benchmark_local(lambda: sum(range(100)), warmups=1, samples=3)

    assert report["warmups"] == 1
    assert report["samples"] == 3
    assert len(report["durations_ms"]) == 3
    assert report["median_ms"] >= 0
    assert "free_threaded_build" in report["environment"]


def test_cpu_comparison_records_same_result_without_fixed_ranking() -> None:
    report = compare_cpu_executors(
        jobs=4,
        rounds_per_job=100,
        warmups=0,
        samples=2,
        max_workers=2,
    )

    assert report.workload_id == "iterated-sha256-v1"
    assert len(report.input_hash) == 64
    assert len(report.expected_result_hash) == 64
    assert set(report.executors) == {
        "loop",
        "thread_pool",
        "process_pool",
        "interpreter_pool",
    }

    for name in ("loop", "thread_pool", "process_pool"):
        observation = report.executors[name]
        assert observation.status == "available", observation.reason
        assert observation.result_hash == report.expected_result_hash
        assert len(observation.samples_ms) == report.samples
        assert all(duration >= 0 for duration in observation.samples_ms)
        assert observation.median_ms is not None
        assert observation.reason is None

    interpreter = report.executors["interpreter_pool"]
    if report.capabilities.interpreter_pool_available:
        assert interpreter.status == "available", interpreter.reason
        assert interpreter.result_hash == report.expected_result_hash
        assert len(interpreter.samples_ms) == report.samples
    else:
        assert interpreter.status == "unavailable"
        assert interpreter.result_hash is None
        assert interpreter.samples_ms == ()
        assert interpreter.reason is not None

    # Tempos são evidência local; o teste não elege vencedor nem impõe speedup.
    assert all(
        observation.status != "available" or observation.median_ms is not None
        for observation in report.executors.values()
    )


def test_cpu_comparison_rejects_invalid_experiment_shape() -> None:
    for arguments in (
        {"jobs": 0},
        {"rounds_per_job": 0},
        {"max_workers": 0},
        {"warmups": -1},
        {"samples": 0},
    ):
        try:
            compare_cpu_executors(**arguments)
        except ValueError:
            pass
        else:
            raise AssertionError(f"argumentos inválidos aceitos: {arguments}")


def test_read_yield_write_loses_updates_and_both_controls_preserve_them() -> None:
    report = demonstrate_shared_counter(workers=6)

    assert report.expected == 6
    assert report.race_reads == (0, 0, 0, 0, 0, 0)
    assert report.race_observed == 1
    assert report.lost_updates == 5
    assert report.lock_observed == report.expected
    assert report.message_passing_observed == report.expected


def test_race_demonstration_requires_competing_workers() -> None:
    try:
        demonstrate_shared_counter(workers=1)
    except ValueError as error:
        assert "workers" in str(error)
    else:
        raise AssertionError("a demonstração aceitou um único worker")
