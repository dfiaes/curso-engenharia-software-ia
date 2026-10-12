import re

_PADRAO = re.compile(r"(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?")


def para_segundos(texto):
    """Converte '1h30m', '45s', '2h', '1h2m3s' em segundos. Texto inválido levanta ValueError."""
    m = _PADRAO.fullmatch(texto)
    if not texto or not m:
        raise ValueError(f"duração inválida: {texto!r}")
    h, mi, s = (int(g) if g else 0 for g in m.groups())
    return h * 3600 + mi * 60 + s
