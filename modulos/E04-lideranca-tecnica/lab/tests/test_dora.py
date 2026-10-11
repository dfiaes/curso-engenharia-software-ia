from __future__ import annotations

from pathlib import Path

import pytest

from leadkit.dora import compute, read_deploys, read_incidents
from leadkit.errors import InputError

DATA = Path(__file__).resolve().parent.parent / "data"

DEPLOYS = """deploy_id,service,commit_time,deploy_time
d1,api,2026-09-01T08:00:00Z,2026-09-01T10:00:00Z
d2,api,2026-09-02T08:00:00Z,2026-09-02T14:00:00Z
d3,web,2026-09-03T08:00:00Z,2026-09-03T20:00:00Z
d4,web,2026-09-08T08:00:00Z,2026-09-08T09:00:00Z
"""
INCIDENTS = """incident_id,deploy_id,started_at,resolved_at
i1,d2,2026-09-02T14:10:00Z,2026-09-02T16:10:00Z
i2,d2,2026-09-02T15:00:00Z,2026-09-02T15:30:00Z
i3,d3,2026-09-03T20:05:00Z,
"""


def _write(tmp_path: Path, name: str, content: str) -> Path:
    path = tmp_path / name
    path.write_text(content, encoding="utf-8")
    return path


def test_known_values(tmp_path: Path) -> None:
    deploys = read_deploys(_write(tmp_path, "d.csv", DEPLOYS))
    incidents = read_incidents(_write(tmp_path, "i.csv", INCIDENTS))
    report = compute(deploys, incidents, window_days=7)
    assert report.deploys == 4
    assert report.deploys_per_week == pytest.approx(4.0)
    assert report.lead_time_median_h == pytest.approx(4.0)  # 1, 2, 6, 12 -> (2 + 6) / 2
    assert report.lead_time_p85_h == pytest.approx(12.0)
    assert report.failed_deploys == 2
    assert report.change_failure_rate == pytest.approx(0.5)
    assert report.incidents == 3
    assert report.open_incidents == 1
    assert report.recovery_median_h == pytest.approx(1.25)  # 2.0 h and 0.5 h


def test_two_incidents_on_one_deploy_count_as_one_failed_change(tmp_path: Path) -> None:
    deploys = read_deploys(_write(tmp_path, "d.csv", DEPLOYS))
    incidents = read_incidents(_write(tmp_path, "i.csv", INCIDENTS))
    assert compute(deploys, incidents).failed_deploys == 2  # not 3


def test_no_incidents_means_zero_failure_and_no_recovery_time(tmp_path: Path) -> None:
    deploys = read_deploys(_write(tmp_path, "d.csv", DEPLOYS))
    report = compute(deploys, [])
    assert report.change_failure_rate == 0
    assert report.recovery_median_h is None


def test_default_window_spans_first_to_last_deploy(tmp_path: Path) -> None:
    deploys = read_deploys(_write(tmp_path, "d.csv", DEPLOYS))
    report = compute(deploys, [])
    assert report.window_days == pytest.approx(6.96, abs=0.01)


def test_single_deploy_uses_a_one_day_floor(tmp_path: Path) -> None:
    one = (
        "deploy_id,service,commit_time,deploy_time\n"
        "d1,api,2026-09-01T08:00:00Z,2026-09-01T10:00:00Z\n"
    )
    report = compute(read_deploys(_write(tmp_path, "d.csv", one)), [])
    assert report.window_days == 1.0
    assert report.deploys_per_week == 7.0


@pytest.mark.parametrize(
    ("row", "message"),
    [
        ("d1,api,2026-09-01T08:00:00,2026-09-01T10:00:00Z", "sem fuso"),
        ("d1,api,ontem,2026-09-01T10:00:00Z", "ISO 8601"),
        ("d1,api,2026-09-01T11:00:00Z,2026-09-01T10:00:00Z", "anterior ao commit"),
    ],
)
def test_bad_deploy_rows_are_rejected_with_location(tmp_path: Path, row: str, message: str) -> None:
    path = _write(tmp_path, "d.csv", f"deploy_id,service,commit_time,deploy_time\n{row}\n")
    with pytest.raises(InputError, match=message):
        read_deploys(path)


def test_duplicate_deploy_id_is_rejected(tmp_path: Path) -> None:
    path = _write(
        tmp_path,
        "d.csv",
        "deploy_id,service,commit_time,deploy_time\n"
        "d1,api,2026-09-01T08:00:00Z,2026-09-01T10:00:00Z\n"
        "d1,api,2026-09-01T08:00:00Z,2026-09-01T10:00:00Z\n",
    )
    with pytest.raises(InputError, match="duplicado"):
        read_deploys(path)


def test_incident_pointing_to_unknown_deploy_is_rejected(tmp_path: Path) -> None:
    deploys = read_deploys(_write(tmp_path, "d.csv", DEPLOYS))
    incidents = read_incidents(
        _write(
            tmp_path,
            "i.csv",
            "incident_id,deploy_id,started_at,resolved_at\nx,d99,2026-09-02T14:10:00Z,\n",
        )
    )
    with pytest.raises(InputError, match="d99"):
        compute(deploys, incidents)


def test_incident_resolved_before_start_is_rejected(tmp_path: Path) -> None:
    path = _write(
        tmp_path,
        "i.csv",
        "incident_id,deploy_id,started_at,resolved_at\n"
        "x,d1,2026-09-02T14:10:00Z,2026-09-02T13:00:00Z\n",
    )
    with pytest.raises(InputError, match="antes de começar"):
        read_incidents(path)


def test_empty_deploys_and_bad_window_are_rejected(tmp_path: Path) -> None:
    with pytest.raises(InputError):
        compute([], [])
    deploys = read_deploys(_write(tmp_path, "d.csv", DEPLOYS))
    with pytest.raises(InputError):
        compute(deploys, [], window_days=0)


def test_shipped_sample_month_loads_and_has_one_open_incident() -> None:
    report = compute(read_deploys(DATA / "deploys.csv"), read_incidents(DATA / "incidents.csv"))
    assert report.deploys == 37
    assert report.open_incidents == 1
    assert report.failed_deploys == 5
