PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS work_requests (
    request_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    intent_hash TEXT NOT NULL,
    intent TEXT NOT NULL,
    priority TEXT NOT NULL,
    budget TEXT NOT NULL,
    deadline_at TEXT NOT NULL,
    contract_version TEXT NOT NULL,
    source TEXT,
    UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS ix_work_requests_tenant_request
    ON work_requests (tenant_id, request_id);

CREATE TABLE IF NOT EXISTS advisories (
    request_id TEXT PRIMARY KEY REFERENCES work_requests(request_id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    risk TEXT NOT NULL,
    confidence TEXT NOT NULL,
    signals_json TEXT NOT NULL,
    adapter TEXT NOT NULL,
    adapter_version TEXT NOT NULL,
    adapter_digest TEXT,
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
    request_id TEXT PRIMARY KEY REFERENCES work_requests(request_id) ON DELETE CASCADE,
    outcome TEXT NOT NULL,
    reason_codes_json TEXT NOT NULL,
    policy_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    request_id TEXT NOT NULL REFERENCES work_requests(request_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload_json TEXT NOT NULL
);

