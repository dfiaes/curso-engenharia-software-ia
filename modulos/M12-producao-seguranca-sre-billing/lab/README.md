# M12 production lab

This lab is the executable companion to `M12.html`. Its domain contracts are vendor-neutral:
provider SDKs belong behind ports, while tests run against deterministic fakes.

## Reference components

- `runtime.py`: trusted session authority, closed tool schemas, and policy enforcement;
- `security.py`: content redaction plus filesystem/network constraints;
- `telemetry.py`: allowlist-based span export without prompt/content fields;
- `authorization.py`: explainable policy decisions and exact-intent approvals;
- `tenancy.py`: tenant-aware cache, object, vector, graph, queue, and deletion fakes;
- `reliability.py`: idempotency, ambiguous-outcome reconciliation, quotas, and budgets;
- `billing.py`: append-only usage, entitlement projection, provider port, and reconciliation;
- `sre.py`: burn-rate calculation, multiwindow alerting, and read-only incident assistance.

The in-memory data planes and providers prove domain contracts only. They do not replace
PostgreSQL RLS, distributed coordination, provider test mode, or Capstone end-to-end tests.

## Commands

```powershell
uv sync --frozen
uv run ruff check .
uv run ruff format --check .
uv run mypy --strict src
uv run pytest
```

Current deterministic result: `41 passed`; the PostgreSQL test is skipped until Docker is
available.

PostgreSQL acceptance tests require Docker and the optional group:

```powershell
uv sync --group postgres
uv run pytest -m postgres
```

The migration deliberately separates the application role from ownership and applies
`FORCE ROW LEVEL SECURITY`. Never run it against a non-lab database.
