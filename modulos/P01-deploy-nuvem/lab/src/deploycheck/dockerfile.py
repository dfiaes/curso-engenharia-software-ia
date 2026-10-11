"""Regras sobre o Dockerfile: XR001 usuário, XR002 tag, XR003 segredo, XR010 healthcheck."""

import re
from dataclasses import dataclass

from deploycheck.model import Finding, Severity
from deploycheck.secrets import SECRET_NAME, is_dynamic, looks_like_secret_value

_FROM = re.compile(r"^FROM\s+(?:--\S+\s+)*(?P<image>\S+)(?:\s+AS\s+(?P<alias>\S+))?\s*$", re.I)
_ENV_PAIR = re.compile(r"(?P<k>[A-Za-z_][A-Za-z0-9_]*)=(?P<v>\"[^\"]*\"|'[^']*'|\S*)")


@dataclass(frozen=True, slots=True)
class Instruction:
    line: int
    keyword: str
    args: str


def parse_instructions(text: str) -> list[Instruction]:
    """Junta continuações com barra invertida e descarta comentários. Mantém a 1ª linha."""
    out: list[Instruction] = []
    buffer = ""
    start = 0
    for number, raw in enumerate(text.splitlines(), start=1):
        stripped = raw.strip()
        if not buffer and (not stripped or stripped.startswith("#")):
            continue
        if not buffer:
            start = number
        if stripped.endswith("\\"):
            buffer += stripped[:-1] + " "
            continue
        buffer += stripped
        keyword, _, args = buffer.partition(" ")
        out.append(Instruction(start, keyword.upper(), args.strip()))
        buffer = ""
    if buffer:
        keyword, _, args = buffer.partition(" ")
        out.append(Instruction(start, keyword.upper(), args.strip()))
    return out


def _pinned(image: str) -> bool:
    if "@sha256:" in image:
        return True
    name = image.rsplit("/", 1)[-1]
    if ":" not in name:
        return False
    return name.split(":", 1)[1] != "latest"


def check_dockerfile(text: str, path: str = "Dockerfile") -> list[Finding]:
    findings: list[Finding] = []
    instructions = parse_instructions(text)
    aliases: set[str] = set()
    last_from_line = 0
    final_user: tuple[int, str] | None = None
    has_healthcheck = False

    for ins in instructions:
        if ins.keyword == "FROM":
            last_from_line = ins.line
            final_user = None  # USER vale por estágio: só o do último estágio conta
            has_healthcheck = False
            match = _FROM.match(f"FROM {ins.args}")
            if match is None:
                continue
            image = match["image"]
            if image.lower() not in aliases and image != "scratch" and not _pinned(image):
                findings.append(
                    Finding(
                        "XR002",
                        Severity.ERROR,
                        path,
                        ins.line,
                        f"imagem base '{image}' sem tag fixa (ou :latest); use tag exata ou digest",
                    )
                )
            if match["alias"]:
                aliases.add(match["alias"].lower())
        elif ins.keyword == "USER":
            final_user = (ins.line, ins.args.split()[0] if ins.args else "")
        elif ins.keyword == "HEALTHCHECK":
            has_healthcheck = not ins.args.upper().startswith("NONE")
        elif ins.keyword == "COPY" and ins.args.startswith("--from="):
            source = ins.args.split()[0].removeprefix("--from=")
            if (
                source.lower() not in aliases
                and ("/" in source or ":" in source)
                and not _pinned(source)
            ):
                findings.append(
                    Finding(
                        "XR002",
                        Severity.ERROR,
                        path,
                        ins.line,
                        f"COPY --from='{source}' sem tag fixa; use versão exata",
                    )
                )
        elif ins.keyword in {"ENV", "ARG"}:
            findings.extend(_secret_in_env(ins, path))

    if last_from_line == 0:
        findings.append(Finding("XR001", Severity.ERROR, path, 1, "Dockerfile sem FROM"))
        return findings
    if final_user is None:
        findings.append(
            Finding(
                "XR001",
                Severity.ERROR,
                path,
                last_from_line,
                "estágio final sem USER: o container roda como root",
            )
        )
    else:
        line, who = final_user
        name = who.split(":", 1)[0].lower()
        if name in {"root", "0"}:
            findings.append(
                Finding(
                    "XR001",
                    Severity.ERROR,
                    path,
                    line,
                    f"USER {who} é root; use uid sem privilégio",
                )
            )
    if not has_healthcheck:
        findings.append(
            Finding(
                "XR010",
                Severity.WARN,
                path,
                last_from_line,
                "sem HEALTHCHECK no estágio final (útil em Docker/Compose; o Container Apps "
                "usa probes do Bicep e ignora esta instrução)",
            )
        )
    return findings


def _secret_in_env(ins: Instruction, path: str) -> list[Finding]:
    found: list[Finding] = []
    pairs = [(m["k"], m["v"].strip("\"'")) for m in _ENV_PAIR.finditer(ins.args)]
    if not pairs and ins.keyword == "ENV":  # forma legada `ENV NOME valor`
        key, _, value = ins.args.partition(" ")
        pairs = [(key, value.strip("\"'"))]
    for key, value in pairs:
        by_value = looks_like_secret_value(value)
        by_name = SECRET_NAME.search(key) and value and not is_dynamic(value)
        if by_value or by_name:
            why = by_value or f"nome '{key}' indica credencial"
            found.append(
                Finding(
                    "XR003",
                    Severity.ERROR,
                    path,
                    ins.line,
                    f"segredo literal em {ins.keyword} {key} ({why}); imagens vazam o que carregam",
                )
            )
    return found
