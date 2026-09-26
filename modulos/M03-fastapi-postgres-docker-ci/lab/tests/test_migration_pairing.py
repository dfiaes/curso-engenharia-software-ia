"""Emparelhamento upgrade/downgrade das migrations (AT-005/AT-008, estático).

Roda sem banco: importa cada revision em ``migrations/versions/`` e
exige cadeia íntegra — revision única, ``down_revision`` encadeado a
partir de ``None``, ``upgrade`` e ``downgrade`` presentes em todas, e a
constraint de unicidade do slug declarada no upgrade da base.
A execução real (upgrade/downgrade num PostgreSQL limpo) fica no teste
marcado com ``postgres``, bloqueado sem Docker.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

VERSIONS = Path(__file__).resolve().parent.parent / "migrations" / "versions"


def _load_all() -> dict[str, object]:
    modules: dict[str, object] = {}
    for path in sorted(VERSIONS.glob("*.py")):
        if path.name.startswith("_"):
            continue
        spec = importlib.util.spec_from_file_location(path.stem, path)
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        modules[path.name] = module
    return modules


def test_existe_revision_base() -> None:
    assert list(VERSIONS.glob("*.py")), "nenhuma revision encontrada"


def test_cada_revision_tem_upgrade_e_downgrade() -> None:
    for name, module in _load_all().items():
        assert isinstance(getattr(module, "revision", None), str), name
        assert callable(getattr(module, "upgrade", None)), name
        assert callable(getattr(module, "downgrade", None)), name


def test_cadeia_encadeada_sem_buraco() -> None:
    revisions = {m.revision: m for m in _load_all().values()}  # type: ignore[attr-defined]
    assert len(revisions) == len(_load_all()), "revision duplicada"
    downs = [m.down_revision for m in revisions.values()]  # type: ignore[attr-defined]
    assert downs.count(None) == 1, "deve haver exatamente uma base (down_revision=None)"
    for down in downs:
        if down is not None:
            assert down in revisions, f"down_revision {down!r} não existe"


def test_upgrade_base_declara_unicidade_do_slug() -> None:
    base = next(m for m in _load_all().values() if m.down_revision is None)  # type: ignore[attr-defined]
    source = (VERSIONS / "0001_create_links_table.py").read_text(encoding="utf-8")
    assert "UniqueConstraint" in source and "slug" in source
    assert "def downgrade" in source and "drop_table" in source
    assert base.revision == "0001"  # type: ignore[attr-defined]
