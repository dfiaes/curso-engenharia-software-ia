"""TDD kata: parse a duration such as ``1h30m`` into seconds."""

import re

_SEGUNDOS = {"d": 86_400, "h": 3_600, "m": 60, "s": 1}
_VALIDA = re.compile(r"(?:\d+[dhms])+")
_PARTE = re.compile(r"(\d+)([dhms])")


def parse_duration(texto: str) -> int:
    limpo = "".join(texto.split())
    if not limpo:
        raise ValueError("duração vazia")
    if not _VALIDA.fullmatch(limpo):
        raise ValueError(f"duração inválida: {texto!r}")
    total = 0
    vistas: set[str] = set()
    for numero, unidade in _PARTE.findall(limpo):
        if unidade in vistas:
            raise ValueError(f"unidade repetida: {unidade}")
        vistas.add(unidade)
        total += int(numero) * _SEGUNDOS[unidade]
    return total
