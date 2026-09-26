"""Índices, plano e JSONB no nível de schema e mecânica (AT-009/011/012).

Limite honesto: o plano EXPLAIN real, o índice GIN e a contenção ``@>``
só existem no PostgreSQL — prova BLOCKED no teste ``postgres``. Estes
oráculos provam sem serviços:

- AT-009 (parcial): os predicados críticos têm índice declarado no
  schema — unicidade do slug e ordenação por data;
- AT-011 (parcial): a coluna `meta` é JSONB no dialeto PostgreSQL e a
  cauda variável persiste, filtra e volta íntegra;
- AT-012: cada teste recebe banco isolado (arquivo temporário próprio);
  dois testes escrevem o mesmo slug e ambos passam em qualquer ordem.
"""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.schema import CreateTable

from link_shortener.db import create_engine, session_factory
from link_shortener.models import Base, Link

LINKS = Base.metadata.tables["links"]


def test_slug_tem_indice_unico() -> None:
    slug_indexes = [ix for ix in LINKS.indexes if "slug" in {c.name for c in ix.columns}]
    assert slug_indexes, "predicado crítico (slug) sem índice"
    assert any(ix.unique for ix in slug_indexes), "slug exige unicidade no schema"


def test_created_at_tem_indice() -> None:
    assert "ix_links_created_at" in {ix.name for ix in LINKS.indexes}


def test_meta_e_jsonb_no_postgres() -> None:
    # Os stubs não tipam a compilação por dialeto; o oráculo é a string DDL.
    ddl = str(CreateTable(LINKS).compile(dialect=postgresql.dialect()))  # type: ignore[no-untyped-call]
    assert "JSONB" in ddl, ddl


async def _make_factory(
    tmp_path: Path, name: str
) -> tuple[async_sessionmaker[AsyncSession], AsyncEngine]:
    url = f"sqlite+aiosqlite:///{tmp_path}/{name}.db"
    engine = create_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return session_factory(engine), engine


async def test_meta_persiste_filtra_e_volta(tmp_path: Path) -> None:
    factory, engine = await _make_factory(tmp_path, "jsonb")
    try:
        async with factory() as session:
            session.add_all(
                [
                    Link(slug="c7-a", url="https://exemplo.com/a", meta={"campanha": "c7"}),
                    Link(slug="c8-a", url="https://exemplo.com/b", meta={"campanha": "c8"}),
                ]
            )
            await session.commit()
        async with factory() as session:
            # A grafia do operador é específica do dialeto (no PostgreSQL,
            # `->>`/`@>` com GIN — prova BLOCKED no teste `postgres`).
            # O que este oráculo prova: a cauda persiste e filtra no banco.
            result = await session.execute(
                select(Link).where(func.json_extract(Link.meta, "$.campanha") == "c7")
            )
            found = result.scalars().all()
            assert [link.slug for link in found] == ["c7-a"]
            assert found[0].meta == {"campanha": "c7"}
    finally:
        await engine.dispose()


async def _escreve_e_conta(tmp_path: Path, name: str) -> int:
    factory, engine = await _make_factory(tmp_path, name)
    try:
        async with factory() as session:
            session.add(Link(slug="mesmo-slug", url="https://exemplo.com/x"))
            await session.commit()
        async with factory() as session:
            result = await session.execute(select(Link))
            return len(result.scalars().all())
    finally:
        await engine.dispose()


async def test_estado_isolado_a(tmp_path: Path) -> None:
    assert await _escreve_e_conta(tmp_path, "iso-a") == 1


async def test_estado_isolado_b(tmp_path: Path) -> None:
    assert await _escreve_e_conta(tmp_path, "iso-b") == 1
