"""DORA-style delivery metrics computed from two CSV files."""

from __future__ import annotations

import csv
import statistics
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from leadkit.errors import InputError
from leadkit.stats import percentile

SECONDS_PER_HOUR = 3600.0
SECONDS_PER_DAY = 86_400.0


@dataclass(frozen=True, slots=True)
class Deploy:
    deploy_id: str
    service: str
    commit_time: datetime
    deploy_time: datetime


@dataclass(frozen=True, slots=True)
class Incident:
    incident_id: str
    deploy_id: str
    started_at: datetime
    resolved_at: datetime | None


@dataclass(frozen=True, slots=True)
class DoraReport:
    deploys: int
    window_days: float
    deploys_per_week: float
    lead_time_median_h: float
    lead_time_p85_h: float
    failed_deploys: int
    change_failure_rate: float
    incidents: int
    open_incidents: int
    recovery_median_h: float | None


def _timestamp(raw: str, where: str) -> datetime:
    try:
        value = datetime.fromisoformat(raw)
    except ValueError:
        raise InputError(f"{where}: '{raw}' não é data ISO 8601") from None
    if value.tzinfo is None:
        raise InputError(f"{where}: '{raw}' sem fuso; use Z ou +00:00")
    return value


def _read(path: Path, columns: tuple[str, ...]) -> list[tuple[int, dict[str, str]]]:
    try:
        handle = path.open(encoding="utf-8", newline="")
    except OSError as exc:
        raise InputError(f"{path}: {exc.strerror}") from exc
    with handle:
        reader = csv.DictReader(handle)
        missing = [c for c in columns if c not in (reader.fieldnames or [])]
        if missing:
            raise InputError(f"{path.name}: faltam colunas {', '.join(missing)}")
        return [
            (n, {k: (v or "").strip() for k, v in row.items() if k})
            for n, row in enumerate(reader, start=2)
        ]


def read_deploys(path: Path) -> list[Deploy]:
    """Read ``deploy_id,service,commit_time,deploy_time``."""
    deploys: list[Deploy] = []
    seen: set[str] = set()
    for n, row in _read(path, ("deploy_id", "service", "commit_time", "deploy_time")):
        where = f"{path.name}:{n}"
        if row["deploy_id"] in seen:
            raise InputError(f"{where}: deploy_id duplicado '{row['deploy_id']}'")
        seen.add(row["deploy_id"])
        commit = _timestamp(row["commit_time"], where)
        deployed = _timestamp(row["deploy_time"], where)
        if deployed < commit:
            raise InputError(f"{where}: deploy anterior ao commit")
        deploys.append(Deploy(row["deploy_id"], row["service"], commit, deployed))
    return deploys


def read_incidents(path: Path) -> list[Incident]:
    """Read ``incident_id,deploy_id,started_at,resolved_at`` (empty resolved_at = open)."""
    incidents: list[Incident] = []
    for n, row in _read(path, ("incident_id", "deploy_id", "started_at", "resolved_at")):
        where = f"{path.name}:{n}"
        started = _timestamp(row["started_at"], where)
        resolved = _timestamp(row["resolved_at"], where) if row["resolved_at"] else None
        if resolved is not None and resolved < started:
            raise InputError(f"{where}: incidente resolvido antes de começar")
        incidents.append(Incident(row["incident_id"], row["deploy_id"], started, resolved))
    return incidents


def compute(
    deploys: Sequence[Deploy],
    incidents: Sequence[Incident],
    *,
    window_days: float | None = None,
) -> DoraReport:
    """Compute the four classic metrics.

    A deploy counts as failed when at least one incident points at it; two
    incidents on the same deploy are one failed change, not two.
    """
    if not deploys:
        raise InputError("nenhum deploy informado")
    known = {d.deploy_id for d in deploys}
    for inc in incidents:
        if inc.deploy_id not in known:
            raise InputError(
                f"incidente {inc.incident_id}: deploy_id desconhecido '{inc.deploy_id}'"
            )

    if window_days is None:
        first = min(d.deploy_time for d in deploys)
        last = max(d.deploy_time for d in deploys)
        window_days = max((last - first).total_seconds() / SECONDS_PER_DAY, 1.0)
    elif window_days <= 0:
        raise InputError("a janela precisa ser positiva")

    lead_times = sorted(
        (d.deploy_time - d.commit_time).total_seconds() / SECONDS_PER_HOUR for d in deploys
    )
    failed = {inc.deploy_id for inc in incidents}
    recoveries = [
        (inc.resolved_at - inc.started_at).total_seconds() / SECONDS_PER_HOUR
        for inc in incidents
        if inc.resolved_at is not None
    ]
    return DoraReport(
        deploys=len(deploys),
        window_days=window_days,
        deploys_per_week=len(deploys) / window_days * 7,
        lead_time_median_h=statistics.median(lead_times),
        lead_time_p85_h=percentile(lead_times, 85),
        failed_deploys=len(failed),
        change_failure_rate=len(failed) / len(deploys),
        incidents=len(incidents),
        open_incidents=sum(1 for inc in incidents if inc.resolved_at is None),
        recovery_median_h=statistics.median(recoveries) if recoveries else None,
    )
