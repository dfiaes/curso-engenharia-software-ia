"""Adapter SQLite local com transação única e auditoria sem conteúdo da intenção."""

from __future__ import annotations

import importlib.resources
import json
import sqlite3
from collections.abc import Callable
from decimal import Decimal
from pathlib import Path
from typing import Any

from work_intake.domain.models import (
    AdvisorIdentity,
    AdvisorStatus,
    Advisory,
    AdvisoryCategory,
    Decision,
    EvaluationResult,
    Outcome,
    Risk,
    WorkRequest,
)
from work_intake.ports.repository import StoredEvaluation


class SQLiteEvaluationRepository:
    def __init__(
        self,
        database_path: Path,
        *,
        failure_hook: Callable[[str], None] | None = None,
    ) -> None:
        self._path = database_path
        self._failure_hook = failure_hook
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._path, isolation_level=None, timeout=5)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _initialize(self) -> None:
        migration = (
            importlib.resources.files("work_intake.adapters.sqlite")
            .joinpath("001_initial.sql")
            .read_text(encoding="utf-8")
        )
        with self._connect() as connection:
            connection.executescript(migration)

    def find_by_idempotency(self, tenant_id: str, key: str) -> StoredEvaluation | None:
        query = """
            SELECT r.request_id, r.intent_hash, r.contract_version,
                   a.category, a.risk, a.confidence, a.signals_json,
                   a.adapter, a.adapter_version, a.adapter_digest, a.status,
                   d.outcome, d.reason_codes_json, d.policy_version
              FROM work_requests AS r
              JOIN advisories AS a ON a.request_id = r.request_id
              JOIN decisions AS d ON d.request_id = r.request_id
             WHERE r.tenant_id = ? AND r.idempotency_key = ?
        """
        with self._connect() as connection:
            row = connection.execute(query, (tenant_id, key)).fetchone()
        if row is None:
            return None
        signals = tuple(str(item) for item in json.loads(row["signals_json"]))
        reason_codes = tuple(str(item) for item in json.loads(row["reason_codes_json"]))
        advisory = Advisory(
            category=AdvisoryCategory(row["category"]),
            risk=Risk(row["risk"]),
            confidence=Decimal(row["confidence"]),
            signals=signals,
        )
        decision = Decision(
            request_id=str(row["request_id"]),
            outcome=Outcome(row["outcome"]),
            reason_codes=reason_codes,
            policy_version=str(row["policy_version"]),
            contract_version=str(row["contract_version"]),
        )
        result = EvaluationResult(
            decision=decision,
            advisory=advisory,
            advisor_identity=AdvisorIdentity(
                adapter=str(row["adapter"]),
                version=str(row["adapter_version"]),
                digest=str(row["adapter_digest"]) if row["adapter_digest"] is not None else None,
            ),
            advisor_status=AdvisorStatus(row["status"]),
        )
        return StoredEvaluation(intent_hash=str(row["intent_hash"]), result=result)

    def save(self, request: WorkRequest, result: EvaluationResult) -> None:
        connection = self._connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                INSERT INTO work_requests (
                    request_id, tenant_id, idempotency_key, intent_hash, intent,
                    priority, budget, deadline_at, contract_version, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    request.request_id,
                    request.tenant_id,
                    request.idempotency_key,
                    request.intent_hash,
                    request.intent,
                    request.priority.value,
                    format(request.budget, "f"),
                    request.deadline_at.isoformat(),
                    request.contract_version,
                    request.source,
                ),
            )
            self._inject("after_request")
            connection.execute(
                """
                INSERT INTO advisories (
                    request_id, category, risk, confidence, signals_json,
                    adapter, adapter_version, adapter_digest, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    request.request_id,
                    result.advisory.category.value,
                    result.advisory.risk.value,
                    format(result.advisory.confidence, "f"),
                    json.dumps(result.advisory.signals, ensure_ascii=False),
                    result.advisor_identity.adapter,
                    result.advisor_identity.version,
                    result.advisor_identity.digest,
                    result.advisor_status.value,
                ),
            )
            connection.execute(
                """
                INSERT INTO decisions (
                    request_id, outcome, reason_codes_json, policy_version
                ) VALUES (?, ?, ?, ?)
                """,
                (
                    request.request_id,
                    result.decision.outcome.value,
                    json.dumps(result.decision.reason_codes, ensure_ascii=False),
                    result.decision.policy_version,
                ),
            )
            audit_payload = json.dumps(
                {
                    "contract_version": request.contract_version,
                    "idempotency_key": request.idempotency_key,
                    "outcome": result.decision.outcome.value,
                    "policy_version": result.decision.policy_version,
                    "reason_codes": result.decision.reason_codes,
                },
                ensure_ascii=False,
                sort_keys=True,
            )
            connection.execute(
                """
                INSERT INTO audit_events (tenant_id, request_id, event_type, payload_json)
                VALUES (?, ?, 'work_evaluated', ?)
                """,
                (request.tenant_id, request.request_id, audit_payload),
            )
            self._inject("before_commit")
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _inject(self, stage: str) -> None:
        if self._failure_hook is not None:
            self._failure_hook(stage)

    def request_exists(self, tenant_id: str, request_id: str) -> bool:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT 1 FROM work_requests WHERE tenant_id = ? AND request_id = ?",
                (tenant_id, request_id),
            ).fetchone()
        return row is not None

    def row_counts(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        with self._connect() as connection:
            for table in ("work_requests", "advisories", "decisions", "audit_events"):
                row = connection.execute(f"SELECT COUNT(*) AS count FROM {table}").fetchone()
                counts[table] = int(row["count"])
        return counts

    def audit_payloads(self) -> tuple[dict[str, Any], ...]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT payload_json FROM audit_events ORDER BY event_id"
            ).fetchall()
        return tuple(json.loads(row["payload_json"]) for row in rows)
