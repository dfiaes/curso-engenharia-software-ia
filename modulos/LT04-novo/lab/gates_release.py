"""Decision engine: GO, CONDITIONAL GO ou NO-GO por calculo declarado.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (sem imports).
Oracalos LT04-T1-AT-010..012; assinatura humana real = trilha BLOCKED.
"""

from __future__ import annotations

BLOQUEANTES = ("p0", "p1")


def avaliar_gate(claims: list[dict[str, object]]) -> dict[str, object]:
    """Gate aprova so com toda evidencia presente: claim sem evidencia falha fechado."""
    bloqueadores = [str(c["id"]) for c in claims if c.get("evidencia") is not True]
    return {
        "veredito": "aprovado" if not bloqueadores else "reprovado",
        "bloqueadores": bloqueadores,
    }


def _invalido(item: dict[str, object]) -> bool:
    """Condicional exige dono, condicao verificavel e expiracao: sem um, nao vale."""
    return (
        not str(item.get("dono", "")).strip()
        or not str(item.get("condicao", "")).strip()
        or not str(item.get("expiracao", "")).strip()
    )


def decidir(
    resultados: dict[str, dict[str, object]],
    claims: list[dict[str, object]],
    condicionais: list[dict[str, object]],
) -> dict[str, object]:
    """NO-GO com P0/P1 aberto ou claim sem evidencia; CONDITIONAL so com gate verde."""
    sem_evidencia = [c for c in claims if c.get("evidencia") is not True]
    criticos = [str(c["id"]) for c in sem_evidencia if c.get("severidade") in BLOQUEANTES]
    reprovados = [n for n, r in resultados.items() if r.get("veredito") != "aprovado"]
    if criticos or reprovados or sem_evidencia:
        motivo = criticos or reprovados or [str(c["id"]) for c in sem_evidencia]
        return {"decisao": "NO-GO", "motivo": motivo}
    invalidos = [str(i.get("item")) for i in condicionais if _invalido(i)]
    if invalidos:
        return {"decisao": "NO-GO", "motivo": invalidos}
    if condicionais:
        return {"decisao": "CONDITIONAL GO", "motivo": [str(i.get("item")) for i in condicionais]}
    return {"decisao": "GO", "motivo": []}
