"""B3: idempotência, cancelamento, retomada após crash e políticas de limite."""

from pathlib import Path

import pytest

from capstone_lab.ingest import (
    CANCELLED,
    DONE,
    FAILED,
    IngestionWorker,
    JobStore,
    SnapshotStore,
)

Env = tuple[IngestionWorker, SnapshotStore, JobStore]


def _make_source(tmp_path: Path, files: dict[str, bytes]) -> Path:
    src = tmp_path / "repo_src"
    for rel, data in files.items():
        p = src / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
    return src


@pytest.fixture
def env(tmp_path: Path) -> Env:
    store = SnapshotStore(tmp_path / "snapshots")
    jobs = JobStore(tmp_path / "jobs.json")
    return IngestionWorker(store, jobs), store, jobs


def _sample_files() -> dict[str, bytes]:
    return {
        "a/mod.py": b"def a():\n    return 1\n",
        "b/util.py": b"def b():\n    return 2\n",
        ".git/config": b"[core]\n",
        ".env": b"SECRET=never\n",
        "bin/blob.bin": b"\x00\x01\x02",
    }


def test_ingest_concludes_and_applies_ignore_and_binary_rules(tmp_path: Path, env: Env) -> None:
    worker, store, _jobs = env
    src = _make_source(tmp_path, _sample_files())
    job = worker.run("k1", "t1", "repo", src)
    assert job.status == DONE
    assert sorted(job.processed) == ["a/mod.py", "b/util.py"]
    assert ".git/config" in job.skipped and ".env" in job.skipped and "bin/blob.bin" in job.skipped
    index = (store.root / "t1" / "repo" / "index.json").read_text()
    assert "a/mod.py" in index and ".env" not in index


def test_resubmit_same_key_does_not_duplicate_snapshot(tmp_path: Path, env: Env) -> None:
    worker, store, jobs = env
    src = _make_source(tmp_path, _sample_files())
    worker.run("k1", "t1", "repo", src)
    first = jobs.get("k1")
    worker.run("k1", "t1", "repo", src)  # retry total
    second = jobs.get("k1")
    assert first is not None and second is not None
    assert len(second.processed) == len(first.processed)
    files_dir = store.root / "t1" / "repo" / "files"
    assert len(list(files_dir.iterdir())) == 2  # um arquivo por hash distinto


def test_cancel_stops_between_files_and_preserves_partial_state(tmp_path: Path, env: Env) -> None:
    worker, _store, jobs = env
    files = {f"m{i:02d}.py": b"x = 1\n" for i in range(10)}
    src = _make_source(tmp_path, files)

    def cancel_after_first(_rel: str) -> None:
        worker.cancel("k-cancel")

    worker.on_file_processed = cancel_after_first
    job = worker.run("k-cancel", "t1", "repo", src)
    assert job.status == CANCELLED
    persisted = jobs.get("k-cancel")
    assert persisted is not None and persisted.status == CANCELLED
    assert 1 <= len(persisted.processed) < 10
    again = worker.run("k-cancel", "t1", "repo", src)  # cancelado não roda sem retry explícito
    assert again.status == CANCELLED
    worker.on_file_processed = None  # o cancelamento era cenário de teste, não do run retomado
    worker.retry("k-cancel")
    resumed = worker.run("k-cancel", "t1", "repo", src)
    assert resumed.status == DONE
    final = jobs.get("k-cancel")
    assert final is not None and len(final.processed) == 10  # retomou sem perder estado


def test_crash_mid_run_recovers_without_duplicate_processing(tmp_path: Path, env: Env) -> None:
    worker, store, jobs = env
    files = {f"f{i}.py": f"x = {i}\n".encode() for i in range(6)}
    src = _make_source(tmp_path, files)

    class FakeCrash(RuntimeError):
        pass

    calls = {"n": 0}

    def crash_after_three(_rel: str) -> None:
        calls["n"] += 1
        if calls["n"] == 3:
            raise FakeCrash("processo morto no meio do arquivo 3")

    worker.on_file_processed = crash_after_three
    crashed = worker.run("k-crash", "t1", "repo", src)
    assert crashed.status == FAILED
    assert "FakeCrash" in (crashed.error or "")
    assert len(crashed.processed) == 3

    recovered = jobs.recover_interrupted()
    assert recovered == []  # status FAILED já é reconciliável; running nem chegou a persistir

    worker2 = IngestionWorker(store, jobs)  # novo worker = novo processo
    job = worker2.run("k-crash", "t1", "repo", src)
    assert job.status == DONE
    assert len(job.processed) == 6  # completou só o que faltava


def test_run_async_does_not_block_caller(tmp_path: Path, env: Env) -> None:
    worker, _store, _jobs = env
    files = {f"f{i}.py": b"x\n" for i in range(50)}
    src = _make_source(tmp_path, files)
    handle = worker.run_async("k-async", "t1", "repo", src)
    assert handle.status() in {"queued", "running", "done"}  # retorno imediato
    assert handle.wait(timeout=10) == DONE


def test_file_over_size_limit_is_skipped(tmp_path: Path, env: Env) -> None:
    worker, _store, _jobs = env
    big = b"x" * 1_000_001
    src = _make_source(tmp_path, {"ok.py": b"x\n", "big.py": big})
    job = worker.run("k-big", "t1", "repo", src)
    assert job.status == DONE
    assert job.processed == ["ok.py"]
    assert "big.py" in job.skipped
