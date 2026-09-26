"""Aprendizado com dono: registro, acao com prazo e waiver que expira de verdade.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (sem imports).
Oracalos LT04-T1-AT-050..052; incidente real = trilha BLOCKED.
"""

from __future__ import annotations


def validar_registro(inc: dict[str, object]) -> list[str]:
    """Registro exige titulo, timeline com fatos e causas: sem um, nao aprende."""
    problemas = []
    if not str(inc.get("titulo", "")).strip():
        problemas.append("titulo ausente")
    timeline = inc.get("timeline", [])
    if not isinstance(timeline, list) or not timeline:
        problemas.append("timeline ausente")
    causas = inc.get("causas", [])
    if not isinstance(causas, list) or not causas:
        problemas.append("causas ausentes")
    return problemas


def validar_acao(acao: dict[str, object], hoje: str) -> list[str]:
    """Acao exige descricao, dono e prazo futuro: sem dono ou vencida, invalida."""
    problemas = []
    if not str(acao.get("descricao", "")).strip():
        problemas.append("descricao ausente")
    if not str(acao.get("dono", "")).strip():
        problemas.append("dono ausente")
    if str(acao.get("prazo", "")) < hoje:
        problemas.append("prazo ausente ou vencido")
    return problemas


def waiver_valida(waiver: dict[str, object], hoje: str) -> bool:
    """Waiver vale com motivo, dono e expiracao futura: vencida bloqueia release."""
    return (
        bool(str(waiver.get("motivo", "")).strip())
        and bool(str(waiver.get("dono", "")).strip())
        and str(waiver.get("expiracao", "")) >= hoje
    )
