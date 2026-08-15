from pathlib import Path
from uuid import uuid4

import pytest

asyncpg = pytest.importorskip("asyncpg", reason="install the postgres dependency group")
postgres_module = pytest.importorskip(
    "testcontainers.postgres", reason="install the postgres dependency group"
)
PostgresContainer = postgres_module.PostgresContainer


@pytest.mark.postgres
@pytest.mark.asyncio
async def test_rls_fails_closed_and_blocks_cross_tenant_access() -> None:
    migration_path = Path(__file__).parents[1] / "migrations" / "001_security_ledgers.sql"
    migration = migration_path.read_text(encoding="utf-8")
    tenant_a = uuid4()
    tenant_b = uuid4()
    project_a = uuid4()
    project_b = uuid4()

    with PostgresContainer("postgres:18-alpine") as postgres:
        connection = await asyncpg.connect(postgres.get_connection_url().replace("+psycopg2", ""))
        try:
            await connection.execute(migration)
            await connection.execute(
                "INSERT INTO tenants(tenant_id, name) VALUES($1, 'A'), ($2, 'B')",
                tenant_a,
                tenant_b,
            )
            await connection.execute(
                "INSERT INTO projects(project_id, tenant_id, name) "
                "VALUES($1, $2, 'alpha'), ($3, $4, 'beta')",
                project_a,
                tenant_a,
                project_b,
                tenant_b,
            )

            async with connection.transaction():
                await connection.execute("SET LOCAL ROLE course_m12_app")
                assert await connection.fetchval("SELECT count(*) FROM projects") == 0
                await connection.execute(
                    "SELECT set_config('app.tenant_id', $1, true)", str(tenant_a)
                )
                rows = await connection.fetch("SELECT tenant_id FROM projects")
                assert [row["tenant_id"] for row in rows] == [tenant_a]
                with pytest.raises(asyncpg.CheckViolationError):
                    await connection.execute(
                        "INSERT INTO projects(project_id, tenant_id, name) "
                        "VALUES($1, $2, 'attack')",
                        uuid4(),
                        tenant_b,
                    )
        finally:
            await connection.close()
