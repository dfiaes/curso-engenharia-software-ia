import tracemalloc
from io import StringIO
from pathlib import Path

import pytest

from python_senior_lab.parsing import InputContractError, iter_file, iter_stream


def test_stream_parser_is_lazy_and_preserves_utf8() -> None:
    stream = StringIO(
        "id,amount,currency,category,occurred_at\ntx-1,10.5,BRL,café,2026-08-15T10:00:00Z\n"
    )

    iterator = iter_stream(stream)
    assert stream.tell() == 0
    transaction = next(iterator)

    assert transaction.category == "café"
    assert transaction.transaction_id == "tx-1"


def test_invalid_row_preserves_validation_as_cause() -> None:
    stream = StringIO(
        "id,amount,currency,category,occurred_at\ntx-1,not-money,BRL,café,2026-08-15T10:00:00Z\n"
    )

    with pytest.raises(InputContractError) as captured:
        list(iter_stream(stream))

    assert captured.value.__cause__ is not None


def test_header_contract_rejects_extra_column() -> None:
    stream = StringIO(
        "id,amount,currency,category,occurred_at,admin\ntx-1,1,BRL,café,2026-08-15T10:00:00Z,true\n"
    )

    with pytest.raises(InputContractError, match="cabeçalho inválido"):
        list(iter_stream(stream))


def test_row_with_more_values_than_header_has_controlled_error() -> None:
    stream = StringIO(
        "id,amount,currency,category,occurred_at\ntx-1,1,BRL,café,2026-08-15T10:00:00Z,orphan\n"
    )

    with pytest.raises(InputContractError, match="colunas excedentes"):
        list(iter_stream(stream))


def test_large_file_streaming_keeps_peak_memory_bounded(tmp_path: Path) -> None:
    header = "id,amount,currency,category,occurred_at\n"

    def write_fixture(path: Path, rows: int) -> None:
        line = "tx,1.00,BRL,café,2026-08-15T10:00:00Z\n"
        path.write_text(header + line * rows, encoding="utf-8", newline="\n")

    def count_with_peak(path: Path) -> tuple[int, int]:
        tracemalloc.start()
        try:
            count = sum(1 for _ in iter_file(path))
            _, peak = tracemalloc.get_traced_memory()
        finally:
            tracemalloc.stop()
        return count, peak

    small = tmp_path / "small.csv"
    large = tmp_path / "large.csv"
    write_fixture(small, 100)
    write_fixture(large, 10_000)

    small_count, small_peak = count_with_peak(small)
    large_count, large_peak = count_with_peak(large)

    assert (small_count, large_count) == (100, 10_000)
    assert large_peak < max(1_000_000, small_peak * 4)
