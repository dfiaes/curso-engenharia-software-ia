from __future__ import annotations

from pathlib import Path

from sqllab import concurrency


def test_lost_update_read_modify_write_vs_atomic_update(tmp_path: Path) -> None:
    unsafe, safe = concurrency.lost_update(tmp_path / "lost.db")
    assert unsafe == 2  # started at 3, two checkouts, only one decrement survived
    assert safe == 1  # control: the atomic UPDATE keeps both


def test_reader_keeps_its_snapshot_until_it_ends(tmp_path: Path) -> None:
    result = concurrency.snapshot_read(tmp_path / "snap.db")
    assert result.first_read == 1
    assert result.second_read_same_txn == 1  # the committed insert is invisible inside the txn
    assert result.read_after_commit == 2  # control: a new transaction sees it


def test_stale_snapshot_cannot_write_so_write_skew_is_blocked(tmp_path: Path) -> None:
    result = concurrency.write_skew_blocked(tmp_path / "skew.db")
    assert result.second_writer_error == "database is locked"
    assert result.on_call_after == 1  # the invariant "someone is on call" survived


def test_begin_immediate_refuses_a_second_writer_up_front(tmp_path: Path) -> None:
    assert concurrency.writer_blocks_writer(tmp_path / "w.db") == "database is locked"
