"""Guardrail de fronteiras: imports proibidos quebram a suíte (AT-013/014).

A fronteira da arquitetura é import; este teste varre a árvore sintática
de ``src/link_shortener`` e acusa qualquer violação com arquivo e linha.
Inclui controle negativo: um trecho violador sintético que o verificador
é obrigado a acusar — sem ele, o oráculo poderia aprovar tudo por
acidente.
"""

from __future__ import annotations

import ast
from dataclasses import dataclass
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src" / "link_shortener"

# Pacote -> prefixos de módulo proibidos (import ou from-import).
# `composition` (raiz de composição) é isenta por desenho: é o único
# lugar autorizado a conhecer implementações — ver composition.py.
FORBIDDEN: dict[str, tuple[str, ...]] = {
    # `api` recebe a sessão como valor opaco da dependência (o tipo
    # AsyncSession aparece em anotação); o proibido é conhecer
    # repositório, entidade ou SQL executável.
    "api": (
        "link_shortener.repositories",
        "link_shortener.models",
    ),
    "services": (
        "fastapi",
        "sqlalchemy",
        "link_shortener.api",
        "link_shortener.models",
    ),
    "repositories": (
        "fastapi",
        "link_shortener.api",
        "link_shortener.services",
    ),
    "domain": ("link_shortener",),
    "errors": ("link_shortener", "sqlalchemy", "fastapi"),
    "models": ("fastapi", "link_shortener.api", "link_shortener.services"),
}


@dataclass(frozen=True)
class Violation:
    file: str
    line: int
    module: str


def _module_of(path: Path) -> str:
    return path.relative_to(SRC).with_suffix("").as_posix().replace("/", ".")


def check_source(source: str, module: str, filename: str = "<snippet>") -> list[Violation]:
    """Devolve as violações de ``FORBIDDEN`` para um módulo."""
    package = module.split(".")[0] if "." in module else module
    forbidden = FORBIDDEN.get(package, ())
    found: list[Violation] = []
    # `errors` pode usar o núcleo `domain`, mas nada além dele.
    allowed = "link_shortener.domain" if package == "errors" else None
    tree = ast.parse(source, filename=filename)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                found.extend(_check_name(alias.name, forbidden, allowed, filename, node.lineno))
        elif isinstance(node, ast.ImportFrom) and node.module:
            found.extend(_check_name(node.module, forbidden, allowed, filename, node.lineno))
    return found


def _check_name(
    name: str, forbidden: tuple[str, ...], allowed: str | None, filename: str, line: int
) -> list[Violation]:
    if allowed is not None and (name == allowed or name.startswith(allowed + ".")):
        return []
    return (
        [Violation(filename, line, name)]
        if any(name == prefix or name.startswith(prefix + ".") for prefix in forbidden)
        else []
    )


def check_tree(root: Path = SRC) -> list[Violation]:
    """Varre todos os ``*.py`` da referência e acumula violações."""
    found: list[Violation] = []
    for path in sorted(root.rglob("*.py")):
        module = _module_of(path)
        package = module.split(".")[0]
        if package not in FORBIDDEN and package != "__init__":
            continue
        found.extend(check_source(path.read_text(encoding="utf-8"), module, str(path)))
    return found


def test_nenhuma_violacao_na_referencia() -> None:
    violations = check_tree()
    assert violations == [], f"imports ilegais: {violations}"


def test_verificador_acusa_violacao_sintetica() -> None:
    snippet = "from link_shortener.repositories import link_repository\n"
    violations = check_source(snippet, "api.deps")
    assert len(violations) == 1
    assert violations[0].module == "link_shortener.repositories"


def test_verificador_acusa_framework_no_service() -> None:
    snippet = "from fastapi import FastAPI\n"
    assert check_source(snippet, "services.link_service") != []
    assert check_source("from pydantic import BaseModel\n", "services.link_service") == []
