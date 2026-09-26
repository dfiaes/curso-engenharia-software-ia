"""GitOps como dados: reconciliacao, drift manual, config e promocao, sem cluster.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB.
Oraculos LT03-AT-040..043 sobre dicts puros; Flux real na trilha externa.
"""

from __future__ import annotations


def reconciliar(desejado: dict[str, str], observado: dict[str, str]) -> dict[str, object]:
    """Commit converge: observado iguala o Git; status registra revisao e digest."""
    novo = dict(observado)
    novo.update(desejado)
    convergiu = all(novo.get(e) == desejado[e] for e in desejado)
    return {
        "observado": novo,
        "convergiu": convergiu,
        "revisao": desejado.get("revisao", "sem-revisao"),
        "digest": desejado.get("digest", "sem-digest"),
    }


def reverter_manual(
    desejado: dict[str, str], observado: dict[str, str], break_glass: bool
) -> dict[str, str]:
    """Edicao manual revertida; excecao break-glass expira por TTL (AT-041)."""
    if break_glass:
        return dict(observado)
    resultado = dict(observado)
    resultado.update(desejado)
    return resultado


def break_glass_expirado(emitido_em: float, ttl: float, agora: float) -> bool:
    """Excecao com motivo e prazo: apos o TTL, a reversao volta a valer."""
    return agora - emitido_em > ttl


def aplicar_config(saudavel: dict[str, str], proposta: dict[str, str]) -> dict[str, str]:
    """Config invalida falha visivel e preserva o ultimo saudavel (AT-042)."""
    if not proposta.get("valida"):
        return dict(saudavel)
    return dict(proposta)


def promover(digest: str, ambientes: list[str]) -> dict[str, str]:
    """Promocao preserva identidade: mesmo digest atravessa ambientes (AT-043)."""
    return {ambiente: digest for ambiente in ambientes}
