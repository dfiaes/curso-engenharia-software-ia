from __future__ import annotations

import ast
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


def _work_intake_imports(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imports: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module is not None:
            if node.module.startswith("work_intake"):
                imports.add(node.module)
        elif isinstance(node, ast.Import):
            imports.update(name.name for name in node.names if name.name.startswith("work_intake"))
    return imports


def test_architecture_manifest_has_unique_ids_and_existing_paths(lab_root: Path) -> None:
    manifest: dict[str, Any] = json.loads(
        (lab_root / "docs/architecture.json").read_text(encoding="utf-8")
    )
    ids = [component["id"] for component in manifest["components"]]
    assert len(ids) == len(set(ids))
    assert all((lab_root / component["path"]).exists() for component in manifest["components"])
    assert (lab_root / manifest["composition_root"]).is_file()


def test_domain_imports_without_adapters_and_has_no_forbidden_dependencies(
    lab_root: Path,
) -> None:
    domain = lab_root / "python/src/work_intake/domain"
    for source in domain.glob("*.py"):
        imports = _work_intake_imports(source)
        assert all(name.startswith("work_intake.domain") for name in imports)
    completed = subprocess.run(
        [sys.executable, "-I", "-c", "import work_intake.domain.models"],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert completed.returncode == 0, completed.stderr


def test_only_composition_root_imports_concrete_adapters(lab_root: Path) -> None:
    package = lab_root / "python/src/work_intake"
    offenders: list[str] = []
    for source in package.rglob("*.py"):
        relative = source.relative_to(package).as_posix()
        if relative.startswith("adapters/") or relative == "composition.py":
            continue
        if any(name.startswith("work_intake.adapters") for name in _work_intake_imports(source)):
            offenders.append(relative)
    assert offenders == []


def test_layer_dependency_graph_is_acyclic(lab_root: Path) -> None:
    layers = ("domain", "ports", "application", "adapters", "composition", "cli")
    graph: dict[str, set[str]] = {layer: set() for layer in layers}
    package = lab_root / "python/src/work_intake"
    for source in package.rglob("*.py"):
        relative = source.relative_to(package)
        origin = relative.parts[0].removesuffix(".py")
        if origin not in graph:
            continue
        for imported in _work_intake_imports(source):
            parts = imported.split(".")
            if len(parts) >= 2 and parts[1] in graph and parts[1] != origin:
                graph[origin].add(parts[1])

    def visit(node: str, active: set[str], done: set[str]) -> None:
        assert node not in active, f"ciclo detectado em {node}: {graph}"
        if node in done:
            return
        active.add(node)
        for dependency in graph[node]:
            visit(dependency, active, done)
        active.remove(node)
        done.add(node)

    done: set[str] = set()
    for layer in graph:
        visit(layer, set(), done)
