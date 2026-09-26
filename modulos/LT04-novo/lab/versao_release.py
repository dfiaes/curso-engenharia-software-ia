"""Versao como contrato: SemVer, changelog ordenado e vinculo com digest.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (re).
Oracalos LT04-T1-AT-001..003; release/deploy real = trilha BLOCKED.
"""

from __future__ import annotations

import re

SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def parse(versao: str) -> tuple[int, int, int]:
    """SemVer estrito X.Y.Z sem zeros a esquerda: devolve (major, minor, patch)."""
    m = SEMVER.match(versao.strip())
    if m is None:
        raise ValueError(f"versao invalida: {versao!r}")
    return (int(m.group(1)), int(m.group(2)), int(m.group(3)))


def comparar(a: str, b: str) -> int:
    """Ordem total de release: -1 se a<b, 0 se igual, +1 se a>b."""
    pa, pb = parse(a), parse(b)
    return (pa > pb) - (pa < pb)


def changelog_valido(entradas: list[dict[str, str]]) -> list[str]:
    """Cada entrada precisa de versao, data e resumo; ordem decrescente."""
    problemas: list[str] = []
    vistas: list[tuple[int, int, int]] = []
    for i, e in enumerate(entradas):
        for campo in ("versao", "data", "resumo"):
            if not e.get(campo, "").strip():
                problemas.append(f"entrada {i}: campo {campo!r} ausente")
        try:
            vistas.append(parse(e.get("versao", "")))
        except ValueError:
            problemas.append(f"entrada {i}: versao invalida")
    for i in range(1, len(vistas)):
        if vistas[i - 1] <= vistas[i]:
            problemas.append(f"entrada {i}: fora de ordem decrescente")
    return problemas


def vincular_digest(versao: str, digest: str) -> dict[str, str]:
    """Liga versao a um digest imutavel: tag mutavel nunca e identidade."""
    parse(versao)
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", digest):
        raise ValueError(f"digest invalido: {digest!r}")
    return {"versao": versao.strip(), "digest": digest}
