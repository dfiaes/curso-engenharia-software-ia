"""Comunicacao que vincula: quem aprova qual risco e revisor que reproduz.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (sem imports).
Oracalos LT04-T1-AT-040..042; reuniao real = trilha BLOCKED.
"""

from __future__ import annotations

EXIGIDOS = {
    "medio": ["engenharia"],
    "alto": ["engenharia", "seguranca"],
    "critico": ["engenharia", "seguranca", "negocio"],
}


def exigidos(risco: str) -> list[str]:
    """Aprovadores do tier: tier desconhecido e erro, nao palpite."""
    if risco not in EXIGIDOS:
        raise ValueError(f"tier de risco desconhecido: {risco!r}")
    return list(EXIGIDOS[risco])


def aprovacao_ok(presentes: list[str], risco: str) -> bool:
    """Publica so com todos os exigidos presentes: risco sem dono bloqueia."""
    return all(p in presentes for p in exigidos(risco))


def reproducao_ok(registro: dict[str, object], digest: str, brutos: dict[str, object]) -> bool:
    """Revisor independente refaz do mesmo digest: claim sem bruto nao reproduz."""
    claims = registro.get("claims", [])
    return (
        registro.get("digest") == digest
        and isinstance(claims, list)
        and bool(claims)
        and all(str(c) in brutos for c in claims)
    )
