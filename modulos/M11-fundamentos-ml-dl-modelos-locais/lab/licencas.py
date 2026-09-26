"""Classificador de licenca em 4 faixas; sem rede, sem pesos.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (enum).
"""

from enum import StrEnum


class Faixa(StrEnum):
    OSS_REAL = "oss-real"
    PESOS_PROPRIA = "pesos-proprios"
    NAO_COMERCIAL = "nao-comercial"
    DESTILADO_CINZENTO = "destilado-cinzento"


BLOQUEIA_COMERCIAL: tuple[Faixa, ...] = (
    Faixa.NAO_COMERCIAL,
    Faixa.DESTILADO_CINZENTO,
)
"""Faixas que vetam produto pago sem excecao nesta decisao."""


def classificar(texto_licenca: str) -> Faixa:
    """Mapeia o texto da licenca para uma das 4 faixas."""
    t = texto_licenca.lower()
    if "non-commercial" in t or "cc-by-nc" in t or " nc" in t:
        return Faixa.NAO_COMERCIAL
    if "distill" in t or "destil" in t:
        return Faixa.DESTILADO_CINZENTO
    if "apache-2.0" in t or t.strip() == "mit" or "mit license" in t:
        return Faixa.OSS_REAL
    return Faixa.PESOS_PROPRIA


def veredito_comercial(faixa: Faixa) -> str:
    """'liberado', 'ler-licenca' ou 'bloqueado'."""
    if faixa is Faixa.OSS_REAL:
        return "liberado"
    if faixa is Faixa.PESOS_PROPRIA:
        return "ler-licenca"
    return "bloqueado"
