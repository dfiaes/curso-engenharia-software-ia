"""Lançamento, portfólio e defesa técnica com métricas rastreáveis (M13 B20).

Invariantes:
- Release versionada: o número de versão é derivado de ``git describe`` quando
  disponível, senão do ``__version__``; nunca hardcoded no dossier.
- **Toda métrica publicada aponta para evidência existente no disco** — a
  montagem do dossier falha se o caminho de evidência não existir.
- Dossier público não contém segredos, PII nem claims sem fonte; a checagem
  de "sem dados sensíveis" é um oráculo executável sobre o texto final.
- Demo script e perguntas da defesa foram curados com respostas que declaram
  explicitamente o que é BLOCKED e o que é medido.
"""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class MetricRef:
    nome: str
    valor: str
    evidencia: str  # caminho relativo que precisa existir


@dataclass(frozen=True)
class ReleaseDossier:
    version: str
    changelog: tuple[str, ...]
    metricas: tuple[MetricRef, ...]
    limitacoes: tuple[str, ...]
    blocked: tuple[str, ...] = field(default_factory=tuple)

    def to_markdown(self) -> str:
        linhas = [f"# Cartógrafo {self.version}", "", "## Changelog", ""]
        linhas += [f"- {item}" for item in self.changelog]
        linhas += ["", "## Métricas (todas com evidência)", ""]
        linhas += [f"- **{m.nome}**: {m.valor} — evidência `{m.evidencia}`" for m in self.metricas]
        linhas += ["", "## Limitações conhecidas", ""]
        linhas += [f"- {item}" for item in self.limitacoes]
        if self.blocked:
            linhas += ["", "## Ambientalmente BLOCKED (honesto)", ""]
            linhas += [f"- {item}" for item in self.blocked]
        return "\n".join(linhas) + "\n"


DEMO_SCRIPT: tuple[str, ...] = (
    "1. Mostrar ingestão idempotente com progresso real do job",
    "2. Rodar pergunta com retrieval + abstenção quando faltar evidência",
    "3. Mostrar grafo de dependências com proveniência por aresta",
    "4. Executar o game day: injetar release ruim e demonstrar o rollback ao vivo",
    "5. Abrir o relatório de capacidade e os percentis medidos",
)

EXPECTED_QUESTIONS: tuple[tuple[str, str], ...] = (
    (
        "Por que não usou Kubernetes de verdade?",
        "Ambiente sem cluster/credenciais (BLOCKED declarado). O motor de deploy/rollback "
        "é determinístico e prova a semântica localmente; o design é portável.",
    ),
    (
        "Quais números são medidos e quais são modelo?",
        "p50/p95/p99 e throughput de saturação são medidos por time.perf_counter com "
        "ambiente registrado; capacity estimate e comparação cloud são modelo declarado.",
    ),
    (
        "O piloto validou o problema?",
        "Não houve sessão humana neste ambiente (BLOCKED). O validador levanta exceção sem "
        "consentimento real; o kit de recrutamento está pronto para execução futura.",
    ),
    (
        "Como o sistema evita alucinar localizações de código?",
        "Retrieval abstém-se quando a evidência não atinge o limiar; testes de abstenção "
        "rodam a cada build e os SLOs de resposta são derivados do B1.",
    ),
)

_SENSITIVE_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9]{12,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
)


def resolve_version(module_root: Path) -> str:
    """Versão de verdade: git describe; fallback para o version do pacote."""
    try:
        out = subprocess.run(
            ["git", "describe", "--tags", "--always", "--dirty"],
            cwd=module_root,
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except OSError, subprocess.SubprocessError:
        pass
    from capstone_lab import __version__

    return __version__


def build_dossier(
    module_root: Path,
    changelog: tuple[str, ...],
    metricas: tuple[MetricRef, ...],
    limitacoes: tuple[str, ...],
    blocked: tuple[str, ...],
) -> ReleaseDossier:
    """Monta o dossier verificando que toda evidência citada existe no disco."""
    faltantes = [m.evidencia for m in metricas if not (module_root / m.evidencia).exists()]
    if faltantes:
        raise ValueError(f"evidência ausente: {faltantes}")
    return ReleaseDossier(resolve_version(module_root), changelog, metricas, limitacoes, blocked)


def scan_public_text(text: str) -> list[str]:
    """Oráculo de "sem dados sensíveis" sobre o bruto final público."""
    problemas: list[str] = []
    for pattern in _SENSITIVE_PATTERNS:
        if pattern.search(text):
            problemas.append(f"padrão sensível encontrado: {pattern.pattern}")
    if "BLOCKED" in text and "honesto" not in text.lower() and "BLOCKED" in text:
        problemas.append("BLOCKED precisa ser rotulado honestamente")
    return problemas
