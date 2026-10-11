"""Regras sobre Bicep, por varredura de texto (não é um parser; ver README sobre limites).

XR003 segredo literal · XR004 variável de ambiente desconhecida · XR005 probes de health ·
XR008 imagem :latest · XR009 identidade gerenciada ausente ou acesso por chave.
"""

import re
from collections.abc import Collection

from deploycheck.model import Finding, Severity
from deploycheck.secrets import SECRET_NAME, looks_like_secret_value

_ENV_ITEM = re.compile(
    r"name:\s*'(?P<name>[A-Z][A-Z0-9_]*)'\s*,?\s*(?P<kind>value|secretRef):\s*(?P<val>[^\n}]+)"
)
_PROBE_TYPE = re.compile(r"type:\s*'(?P<kind>Liveness|Readiness|Startup)'")
_PATH = re.compile(r"path:\s*'(?P<path>[^']+)'")
_REQUIRED_PROBES = {"Liveness": "/healthz", "Readiness": "/readyz"}


def _line(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def _strip_comments(text: str) -> str:
    """Troca comentários por espaços para preservar posições (e números de linha)."""
    text = re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group()), text, flags=re.S)
    return re.sub(r"//[^\n]*", lambda m: " " * len(m.group()), text)


def _enclosing_object(text: str, index: int) -> str:
    depth = 0
    start = index
    while start > 0:
        start -= 1
        if text[start] == "}":
            depth += 1
        elif text[start] == "{":
            if depth == 0:
                break
            depth -= 1
    depth = 0
    end = index
    while end < len(text):
        if text[end] == "{":
            depth += 1
        elif text[end] == "}":
            if depth == 0:
                break
            depth -= 1
        end += 1
    return text[start : end + 1]


def check_bicep(text: str, known_env: Collection[str], path: str = "main.bicep") -> list[Finding]:
    code = _strip_comments(text)
    findings: list[Finding] = []

    for m in _ENV_ITEM.finditer(code):
        name, kind, raw = m["name"], m["kind"], m["val"].strip()
        line = _line(code, m.start())
        if name not in known_env:
            findings.append(
                Finding(
                    "XR004",
                    Severity.ERROR,
                    path,
                    line,
                    f"variável '{name}' não é lida pelo serviço (typo? ver KNOWN_ENV)",
                )
            )
        literal = raw.startswith("'") and "${" not in raw
        if kind == "value" and literal and SECRET_NAME.search(name):
            findings.append(
                Finding(
                    "XR003",
                    Severity.ERROR,
                    path,
                    line,
                    f"{name} recebe valor literal; use secretRef apontando para o Key Vault",
                )
            )

    for m in re.finditer(r"'[^'\n]+'", code):
        label = looks_like_secret_value(m.group())
        if label:
            findings.append(
                Finding(
                    "XR003",
                    Severity.ERROR,
                    path,
                    _line(code, m.start()),
                    f"literal com cara de credencial ({label})",
                )
            )

    findings.extend(_probes(code, path))

    for m in re.finditer(r"\b(listKeys|listSecrets|listCredentials)\s*\(", code):
        findings.append(
            Finding(
                "XR009",
                Severity.ERROR,
                path,
                _line(code, m.start()),
                f"{m[1]}() recupera chave de recurso; prefira identidade + RBAC",
            )
        )
    for m in re.finditer(r"disableLocalAuth:\s*false", code):
        findings.append(
            Finding(
                "XR009",
                Severity.ERROR,
                path,
                _line(code, m.start()),
                "disableLocalAuth: false mantém chaves ativas no recurso de modelo",
            )
        )
    if "Microsoft.App/containerApps" in code and not re.search(
        r"identity:\s*\{[^{}]*type:\s*'[^']*(UserAssigned|SystemAssigned)", code, re.S
    ):
        findings.append(
            Finding(
                "XR009",
                Severity.ERROR,
                path,
                1,
                "container app sem identity (UserAssigned ou SystemAssigned)",
            )
        )

    for m in re.finditer(r"[:'\"/][\w./-]+:latest\b", code):
        findings.append(
            Finding(
                "XR008",
                Severity.ERROR,
                path,
                _line(code, m.start()),
                "imagem :latest é mutável; implante por tag imutável (SHA do commit) ou digest",
            )
        )
    return findings


def _probes(code: str, path: str) -> list[Finding]:
    if "Microsoft.App/containerApps" not in code:
        return []
    seen: dict[str, str] = {}
    for m in _PROBE_TYPE.finditer(code):
        obj = _enclosing_object(code, m.start())
        p = _PATH.search(obj)
        if p:
            seen[m["kind"]] = p["path"]
    out: list[Finding] = []
    for kind, expected in _REQUIRED_PROBES.items():
        if kind not in seen:
            out.append(Finding("XR005", Severity.ERROR, path, 1, f"probe {kind} ausente"))
        elif seen[kind] != expected:
            out.append(
                Finding(
                    "XR005",
                    Severity.ERROR,
                    path,
                    1,
                    f"probe {kind} aponta para {seen[kind]}; o serviço expõe {expected}",
                )
            )
    return out
