"""Regras sobre o workflow do GitHub Actions.

XR003 segredo literal · XR006 OIDC (id-token: write, azure/login sem segredo de longa vida) ·
XR007 action em ref flutuante · XR008 :latest · XR012 permissões amplas.
"""

import re
from collections import Counter
from typing import Any

import yaml

from deploycheck.model import Finding, Severity
from deploycheck.secrets import SECRET_NAME, is_dynamic, looks_like_secret_value

_FLOATING = {"main", "master", "latest", "HEAD", "develop"}
_LOGIN_KEYS = ("client-id", "tenant-id", "subscription-id")


def _find_line(text: str, needle: str, nth: int = 0, default: int = 1) -> int:
    """Linha da (nth+1)-ésima ocorrência de `needle`; o YAML parseado perde posições."""
    for number, raw in enumerate(text.splitlines(), start=1):
        if needle in raw:
            if nth == 0:
                return number
            nth -= 1
    return default


def _can_id_token(permissions: Any) -> bool:
    return isinstance(permissions, dict) and permissions.get("id-token") == "write"


def check_workflow(text: str, path: str = "deploy.yml") -> list[Finding]:
    try:
        doc = yaml.safe_load(text)
    except yaml.YAMLError as exc:
        return [Finding("XR000", Severity.ERROR, path, 1, f"YAML inválido: {exc}")]
    if not isinstance(doc, dict) or not isinstance(doc.get("jobs"), dict):
        return [Finding("XR000", Severity.ERROR, path, 1, "workflow sem 'jobs'")]

    findings: list[Finding] = []
    top_perms = doc.get("permissions")
    if top_perms == "write-all" or (isinstance(top_perms, str) and "write" in top_perms):
        findings.append(
            Finding(
                "XR012",
                Severity.ERROR,
                path,
                _find_line(text, "permissions"),
                "permissions amplas no topo; declare o mínimo (contents: read) e eleve por job",
            )
        )

    login_seen = False
    occurrences: Counter[str] = Counter()
    for job_name, job in doc["jobs"].items():
        if not isinstance(job, dict):
            continue
        perms = job.get("permissions", top_perms)
        steps = [s for s in job.get("steps", []) if isinstance(s, dict)]
        for step in steps:
            uses = str(step.get("uses", ""))
            if uses:
                findings.extend(_check_uses(uses, text, path, occurrences[uses]))
                occurrences[uses] += 1
            if uses.startswith("azure/login"):
                login_seen = True
                findings.extend(_check_login(step, perms, job_name, text, path))
            findings.extend(_check_values(step, text, path))
    if not login_seen:
        findings.append(
            Finding(
                "XR006",
                Severity.ERROR,
                path,
                1,
                "nenhum passo azure/login: o pipeline não autentica por OIDC",
            )
        )
    for m in re.finditer(r"[\w./-]+:latest\b", text):
        findings.append(
            Finding(
                "XR008",
                Severity.ERROR,
                path,
                text.count("\n", 0, m.start()) + 1,
                "tag :latest no pipeline; use ${{ github.sha }}",
            )
        )
    return findings


def _check_uses(uses: str, text: str, path: str, nth: int) -> list[Finding]:
    if uses.startswith(("./", "docker://")):
        return []
    _, _, ref = uses.partition("@")
    if not ref or ref in _FLOATING:
        return [
            Finding(
                "XR007",
                Severity.ERROR,
                path,
                _find_line(text, uses, nth),
                f"'{uses}' em ref flutuante; fixe versão (vN) ou, melhor, SHA do commit",
            )
        ]
    return []


def _check_login(step: dict[str, Any], perms: Any, job: str, text: str, path: str) -> list[Finding]:
    out: list[Finding] = []
    line = _find_line(text, "azure/login")
    if not _can_id_token(perms):
        out.append(
            Finding(
                "XR006",
                Severity.ERROR,
                path,
                line,
                f"job '{job}' usa azure/login sem 'permissions: id-token: write'",
            )
        )
    with_args = step.get("with") or {}
    if not isinstance(with_args, dict):
        with_args = {}
    for banned in ("creds", "client-secret"):
        if banned in with_args:
            out.append(
                Finding(
                    "XR006",
                    Severity.ERROR,
                    path,
                    _find_line(text, banned),
                    f"azure/login com '{banned}': segredo de longa vida em vez de OIDC",
                )
            )
    for key in _LOGIN_KEYS:
        if key not in with_args:
            out.append(Finding("XR006", Severity.ERROR, path, line, f"azure/login sem '{key}'"))
    return out


def _check_values(step: dict[str, Any], text: str, path: str) -> list[Finding]:
    out: list[Finding] = []
    for block in ("env", "with"):
        values = step.get(block)
        if not isinstance(values, dict):
            continue
        for key, raw in values.items():
            value = str(raw)
            label = looks_like_secret_value(value)
            by_name = bool(SECRET_NAME.search(str(key))) and not is_dynamic(value)
            if label or by_name:
                out.append(
                    Finding(
                        "XR003",
                        Severity.ERROR,
                        path,
                        _find_line(text, str(key)),
                        f"valor literal em {block}.{key}; use ${{{{ secrets.* }}}} ou OIDC",
                    )
                )
    return out
