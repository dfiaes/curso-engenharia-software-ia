"""Regras determinísticas do verificador (lote M04)."""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

ADR_SECOES_OBRIGATORIAS: tuple[str, ...] = (
    "## Contexto",
    "## Opções consideradas",
    "## Decisão",
    "## Consequências",
)
ADR_STATUS_VALIDOS: tuple[str, ...] = ("proposta", "aceita", "substituída por")

MERMAID_TIPOS_CONHECIDOS: tuple[str, ...] = (
    "flowchart",
    "graph",
    "sequenceDiagram",
    "classDiagram",
    "erDiagram",
    "stateDiagram-v2",
    "C4Context",
    "C4Container",
    "C4Component",
    "C4Dynamic",
    "C4Deployment",
    "gantt",
    "journey",
    "mindmap",
)

# Doc parada enquanto o código que ela descreve andou: alerta a partir de N commits.
LIMITE_COMMITS_SEM_DOC = 15

# Caminho de arquivo citado em prosa ou crase: src/x.py, docs/y.md, ...
RE_CAMINHO = re.compile(
    r"[`(\s](((?:src|app|tools|capstone|docs|tests)/[\w./-]+\.\w{1,5}))[`)\s,.]"
)
RE_MERMAID = re.compile(r"^```mermaid\s*$(.*?)^```\s*$", re.MULTILINE | re.DOTALL)


@dataclass(frozen=True, slots=True)
class Violacao:
    arquivo: Path
    regra: str
    detalhe: str

    def __str__(self) -> str:
        return f"{self.arquivo}: [{self.regra}] {self.detalhe}"


def _git(*args: str, cwd: Path) -> str:
    """Roda git e devolve stdout (string vazia se o comando falhar)."""
    resultado = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=False)
    return resultado.stdout.strip() if resultado.returncode == 0 else ""


def checar_referencias(doc: Path, raiz: Path) -> list[Violacao]:
    """Regra 1: todo caminho de arquivo citado na doc precisa existir."""
    texto = doc.read_text(encoding="utf-8")
    problemas: list[Violacao] = []
    for match in RE_CAMINHO.finditer(texto):
        caminho = match.group(1)
        if not (raiz / caminho).exists():
            problemas.append(Violacao(doc, "ref-quebrada", f"cita '{caminho}', que não existe"))
    return problemas


def checar_adr(doc: Path) -> list[Violacao]:
    """Regra 2: ADR precisa das seções obrigatórias, status válido e um 'porque'."""
    if doc.parent.name != "adr" or doc.name.startswith("0000-"):
        return []
    texto = doc.read_text(encoding="utf-8")
    problemas = [
        Violacao(doc, "adr-estrutura", f"seção obrigatória ausente: '{secao}'")
        for secao in ADR_SECOES_OBRIGATORIAS
        if secao not in texto
    ]
    if not any(status in texto.lower() for status in ADR_STATUS_VALIDOS):
        problemas.append(
            Violacao(doc, "adr-status", f"status ausente ou inválido (use {ADR_STATUS_VALIDOS})")
        )
    if "## Decisão" in texto:
        corpo = texto.split("## Decisão", 1)[1].split("##", 1)[0]
        if "porque" not in corpo.lower() and "por que" not in corpo.lower():
            problemas.append(
                Violacao(doc, "adr-sem-porque", "seção Decisão não contém um 'porque'")
            )
    return problemas


def checar_mermaid(doc: Path) -> list[Violacao]:
    """Regra 3: bloco mermaid precisa de cerca fechada e tipo conhecido."""
    texto = doc.read_text(encoding="utf-8")
    problemas: list[Violacao] = []
    if texto.count("```mermaid") != len(RE_MERMAID.findall(texto)):
        problemas.append(Violacao(doc, "mermaid-cerca", "bloco ```mermaid sem fechamento"))
    for i, bloco in enumerate(RE_MERMAID.findall(texto), start=1):
        primeira = next((linha.strip() for linha in bloco.splitlines() if linha.strip()), "")
        if not primeira.startswith(MERMAID_TIPOS_CONHECIDOS):
            problemas.append(
                Violacao(doc, "mermaid-tipo", f"bloco {i}: tipo desconhecido em '{primeira[:40]}'")
            )
    return problemas


def documenta_alvo(doc: Path) -> str | None:
    """Lê o front matter procurando a chave 'documenta:' (doc -> código)."""
    texto = doc.read_text(encoding="utf-8")
    if not texto.startswith("---"):
        return None
    frente = texto.split("---", 2)[1]
    for linha in frente.splitlines():
        if linha.strip().startswith("documenta:"):
            return linha.split(":", 1)[1].strip()
    return None


def checar_obsolescencia(doc: Path, raiz: Path, codigo: str) -> list[Violacao]:
    """Regra 4: doc parada enquanto o código que ela descreve andou."""
    ultimo_doc = _git("log", "-1", "--format=%H", "--", str(doc), cwd=raiz)
    if not ultimo_doc:
        return []
    commits_depois = _git("rev-list", "--count", f"{ultimo_doc}..HEAD", "--", codigo, cwd=raiz)
    if commits_depois.isdigit() and int(commits_depois) >= LIMITE_COMMITS_SEM_DOC:
        return [
            Violacao(
                doc,
                "obsoleta",
                f"'{codigo}' mudou em {commits_depois} commits desde a última "
                f"atualização desta doc (limite: {LIMITE_COMMITS_SEM_DOC})",
            )
        ]
    return []
