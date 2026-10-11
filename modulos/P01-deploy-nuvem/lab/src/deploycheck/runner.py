"""Orquestra os verificadores sobre arquivos em disco."""

from collections.abc import Callable, Collection
from pathlib import Path

from deploycheck.bicep import check_bicep
from deploycheck.dockerfile import check_dockerfile
from deploycheck.model import Finding, Severity
from deploycheck.workflow import check_workflow


def _read(path: Path) -> str | Finding:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        return Finding(
            "XR000", Severity.ERROR, str(path), 1, f"não foi possível ler: {exc.strerror}"
        )


def check_files(
    *,
    known_env: Collection[str],
    dockerfile: Path | None = None,
    bicep: Path | None = None,
    workflow: Path | None = None,
) -> list[Finding]:
    findings: list[Finding] = []
    checks: tuple[tuple[Path | None, Callable[[str, str], list[Finding]]], ...] = (
        (dockerfile, check_dockerfile),
        (bicep, lambda text, name: check_bicep(text, known_env, name)),
        (workflow, check_workflow),
    )
    for path, check in checks:
        if path is None:
            continue
        content = _read(path)
        if isinstance(content, Finding):
            findings.append(content)
        else:
            findings.extend(check(content, str(path)))
    return sorted(findings, key=lambda f: (f.file, f.line, f.rule))
