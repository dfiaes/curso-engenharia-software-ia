from pathlib import Path

import pytest

asyncpg = pytest.importorskip("asyncpg", reason="install the postgres dependency group")
postgres_module = pytest.importorskip(
    "testcontainers.postgres", reason="install the postgres dependency group"
)
PostgresContainer = postgres_module.PostgresContainer


@pytest.mark.postgres
@pytest.mark.asyncio
async def test_baseline_migration_and_seed_on_postgresql_18() -> None:
    root = Path(__file__).parents[1]
    migration = (root / "migrations" / "001_baseline.sql").read_text(encoding="utf-8")
    seed = (root / "seeds" / "001_reference.sql").read_text(encoding="utf-8")

    with PostgresContainer("postgres:18-alpine") as postgres:
        connection = await asyncpg.connect(postgres.get_connection_url().replace("+psycopg2", ""))
        try:
            await connection.execute(migration)
            await connection.execute(seed)
            assert (
                await connection.fetchval(
                    "SELECT count(*) FROM schema_migrations WHERE version = '001_baseline'"
                )
                == 1
            )
            assert (
                await connection.fetchval(
                    "SELECT count(*) FROM release_metadata WHERE release_id = 'local-reference'"
                )
                == 1
            )
        finally:
            await connection.close()
