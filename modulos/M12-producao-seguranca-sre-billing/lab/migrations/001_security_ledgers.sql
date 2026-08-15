BEGIN;

CREATE ROLE course_m12_app NOLOGIN NOBYPASSRLS;
CREATE ROLE course_m12_migrator NOLOGIN NOBYPASSRLS;

CREATE TABLE tenants (
    tenant_id uuid PRIMARY KEY,
    name text NOT NULL
);

CREATE TABLE projects (
    project_id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
    name text NOT NULL,
    UNIQUE (tenant_id, name)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

CREATE POLICY projects_tenant_isolation ON projects
    FOR ALL TO course_m12_app
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE TABLE idempotency_ledger (
    tenant_id uuid NOT NULL,
    idempotency_key text NOT NULL,
    intent_hash text NOT NULL,
    state text NOT NULL CHECK (state IN ('received','started','succeeded','failed','unknown')),
    response jsonb,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, idempotency_key)
);

CREATE TABLE usage_ledger (
    event_id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(tenant_id),
    meter text NOT NULL,
    quantity numeric(20,8) NOT NULL CHECK (quantity > 0),
    source_id text NOT NULL,
    occurred_at timestamptz NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, source_id)
);

ALTER TABLE idempotency_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_ledger FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_ledger FORCE ROW LEVEL SECURITY;

CREATE POLICY idempotency_tenant_isolation ON idempotency_ledger
    FOR ALL TO course_m12_app
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY usage_tenant_isolation ON usage_ledger
    FOR ALL TO course_m12_app
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON projects, idempotency_ledger, usage_ledger TO course_m12_app;
COMMIT;
