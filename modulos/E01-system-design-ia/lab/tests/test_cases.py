from __future__ import annotations

from pathlib import Path

import pytest

from capacity.__main__ import main
from capacity.cases import (
    ALL_CASES,
    Report,
    case1_rag_assistant,
    case2_agent_platform,
    case3_document_batch,
)

LAB = Path(__file__).resolve().parent.parent


def test_case1_golden_numbers() -> None:
    r = case1_rag_assistant()
    assert r.value("requests_day") == 50_000
    assert r.value("peak_qps") == pytest.approx(4.1667, rel=1e-4)
    assert r.value("latency") == pytest.approx(0.4 + 0.8 + 350 / 60)
    assert r.value("in_flight") == pytest.approx(r.value("peak_qps") * r.value("latency"))
    assert r.value("cost_base") == pytest.approx(23_625.0)
    assert r.value("cost_cache") == pytest.approx(0.8 * 23_625.0)
    assert r.value("cost_routed") < r.value("cost_cache") < r.value("cost_base")


def test_case2_golden_numbers() -> None:
    r = case2_agent_platform()
    assert r.value("tasks_day") == 20_000
    assert r.value("task_in") == 66_000
    assert r.value("task_out") == 3_000
    assert r.value("rpm") == 1_084  # 10 model calls per task, not 1
    assert r.value("workers") >= r.value("in_flight") / 0.7
    assert r.value("month_cached") < r.value("month_plain")
    assert r.value("task_cost_compact") < r.value("task_cost_cached") < r.value("task_cost_25")


def test_case3_golden_numbers() -> None:
    r = case3_document_batch()
    assert r.value("total_batch_cascade") == pytest.approx(r.value("total_sync_cascade") / 2)
    assert r.value("total_sync_cascade") < r.value("total_sync_large")
    assert r.value("sample_lot") == 1_825
    assert r.value("review_pages") == 12 * 1_825


def test_unknown_key_fails_loudly() -> None:
    with pytest.raises(KeyError):
        case1_rag_assistant().value("nao-existe")


def test_render_is_aligned_and_complete() -> None:
    for case in ALL_CASES:
        report: Report = case()
        text = report.render()
        assert text.startswith("== ")
        assert len(text.splitlines()) == len(report.rows) + 1


def test_cli_prints_selected_case(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["2"]) == 0
    out = capsys.readouterr().out
    assert "Caso 2" in out
    assert "Caso 1" not in out


def test_cli_rejects_unknown_case() -> None:
    with pytest.raises(SystemExit) as exc:
        main(["9"])
    assert exc.value.code == 2


def test_design_doc_template_has_the_required_sections() -> None:
    text = (LAB / "template" / "DESIGN-DOC.md").read_text(encoding="utf-8")
    for heading in (
        "## 3. Requisitos",
        "## 4. Estimativas de ordem de grandeza",
        "## 8. Alternativas consideradas",
        "## 9. Avaliação e observabilidade",
        "## 10. Falhas, segurança e custo máximo",
    ):
        assert heading in text
