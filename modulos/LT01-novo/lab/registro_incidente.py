"""Registro de incidente: hipótese antes da leitura, incident.md em seções fixas.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (dataclasses).
Toda evidencia referencia hipotese previa; veredito em vocabulario fechado.
"""

from __future__ import annotations

from dataclasses import dataclass, field

VEREDITOS = ("confirma", "refuta", "inconclusiva")


@dataclass
class Hipotese:
    """Afirmacao testavel com o sinal que a leitura deve mostrar."""

    hipotese_id: str
    enunciado: str
    sinal_esperado: str


@dataclass
class Evidencia:
    """Leitura confrontada com a hipotese que a autorizou."""

    hipotese_id: str
    observacao: str
    veredito: str


@dataclass
class Incidente:
    """Registro vivo: impacto, baseline, hipoteses e evidencias em ordem."""

    identificador: str
    impacto: str
    baseline: str
    hipoteses: dict[str, Hipotese] = field(default_factory=dict)
    evidencias: list[Evidencia] = field(default_factory=list)


def criar_incidente(identificador: str, impacto: str, baseline: str) -> Incidente:
    """Abre o registro com impacto declarado e baseline de comparacao."""
    for nome, valor in (("identificador", identificador), ("impacto", impacto)):
        if not valor.strip():
            raise ValueError(f"{nome} não pode ser vazio")
    if not baseline.strip():
        raise ValueError("baseline não pode ser vazia")
    return Incidente(identificador=identificador, impacto=impacto, baseline=baseline)


def registrar_hipotese(
    incidente: Incidente, hipotese_id: str, enunciado: str, sinal_esperado: str
) -> Hipotese:
    """Registra a hipotese antes de qualquer leitura; id duplicado: ValueError."""
    if not hipotese_id.strip():
        raise ValueError("hipotese_id não pode ser vazio")
    if hipotese_id in incidente.hipoteses:
        raise ValueError(f"hipotese duplicada: {hipotese_id}")
    if not enunciado.strip() or not sinal_esperado.strip():
        raise ValueError("enunciado e sinal_esperado não podem ser vazios")
    hipotese = Hipotese(hipotese_id, enunciado, sinal_esperado)
    incidente.hipoteses[hipotese_id] = hipotese
    return hipotese


def registrar_evidencia(
    incidente: Incidente, hipotese_id: str, observacao: str, veredito: str
) -> Evidencia:
    """Confronta a leitura com a hipotese previa; sem hipotese: ValueError."""
    if hipotese_id not in incidente.hipoteses:
        raise ValueError(f"sem hipotese previa: {hipotese_id}")
    if veredito not in VEREDITOS:
        raise ValueError(f"veredito precisa estar em {VEREDITOS}")
    if not observacao.strip():
        raise ValueError("observacao não pode ser vazia")
    evidencia = Evidencia(hipotese_id, observacao, veredito)
    incidente.evidencias.append(evidencia)
    return evidencia


def gerar_incident_md(incidente: Incidente) -> str:
    """Publica o incident.md em secoes fixas a partir do registro vivo."""
    linhas = [
        f"# Incidente {incidente.identificador}",
        "",
        f"Impacto: {incidente.impacto}",
        f"Baseline: {incidente.baseline}",
        "",
        "## Hipoteses",
    ]
    for hipotese in incidente.hipoteses.values():
        linhas.append(f"- {hipotese.hipotese_id}: {hipotese.enunciado}")
        linhas.append(f"  Sinal esperado: {hipotese.sinal_esperado}")
    linhas.append("")
    linhas.append("## Evidencias")
    for evidencia in incidente.evidencias:
        linhas.append(f"- {evidencia.hipotese_id}: {evidencia.veredito}")
        linhas.append(f"  Observado: {evidencia.observacao}")
    return "\n".join(linhas) + "\n"
