"""Block 1: the same rules written with nesting and with guard clauses."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Reembolso:
    pago: bool
    dias_desde_compra: int
    valor: int  # centavos


PRAZO_DIAS = 30
LIMITE_AGENTE = 50_000


def decidir_aninhado(r: Reembolso, papel: str) -> str:
    if r.pago:
        if r.dias_desde_compra <= PRAZO_DIAS:
            if r.valor <= LIMITE_AGENTE:
                return "aprovado"
            else:
                if papel == "supervisor":
                    return "aprovado"
                else:
                    return "escalar"
        else:
            return "recusado: prazo"
    else:
        return "recusado: não pago"


def decidir(r: Reembolso, papel: str) -> str:
    if not r.pago:
        return "recusado: não pago"
    if r.dias_desde_compra > PRAZO_DIAS:
        return "recusado: prazo"
    if r.valor <= LIMITE_AGENTE or papel == "supervisor":
        return "aprovado"
    return "escalar"


# --- one level of abstraction per function ------------------------------------------------


def importar_misturado(linhas: list[str]) -> int:
    total = 0
    for linha in linhas:
        partes = linha.split(";")
        if len(partes) != 2:
            print(f"linha ignorada: {linha!r}")
            continue
        nome, valor = partes[0].strip(), partes[1].strip().replace(",", ".")
        if not nome or not valor.replace(".", "", 1).isdigit():
            print(f"linha ignorada: {linha!r}")
            continue
        total += round(float(valor) * 100)
    return total


def _ler_linha(linha: str) -> int | None:
    """Return the amount in centavos, or None when the line is malformed."""
    partes = [p.strip() for p in linha.split(";")]
    if len(partes) != 2 or not partes[0]:
        return None
    valor = partes[1].replace(",", ".")
    if not valor.replace(".", "", 1).isdigit():
        return None
    return round(float(valor) * 100)


def importar(linhas: list[str]) -> tuple[int, list[str]]:
    """Return (total in centavos, rejected lines). No printing: the caller decides."""
    total = 0
    rejeitadas = []
    for linha in linhas:
        valor = _ler_linha(linha)
        if valor is None:
            rejeitadas.append(linha)
        else:
            total += valor
    return total, rejeitadas
