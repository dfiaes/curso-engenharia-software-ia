"""Probes, recursos, disrupcao e autoscaling como dados: sem cluster, sem rede.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (math).
Oraculos LT03-AT-020..025 sobre dicts puros e aritmetica deterministica.
"""

from __future__ import annotations

import math

REACOES: dict[str, str] = {
    "inicializacao": "suspende-as-demais",
    "prontidao": "remove-dos-endpoints",
    "vivacidade": "reinicia-container",
}


def reacao(tipo: str) -> str:
    """Reacao contratada de cada probe; tipo desconhecido e defeito."""
    return REACOES.get(tipo, "tipo-desconhecido")


def vivacidade_segura(usa_dependencia_externa: bool) -> bool:
    """Liveness so observa estado interno; externa converte lentidao em suicidio."""
    return not usa_dependencia_externa


def classificar_qos(pedido: dict[str, bool], teto: dict[str, bool]) -> str:
    """Garantida (pedido==teto), intermediaria (pedido parcial), oportunista (nada)."""
    chaves = ("cpu", "memoria")
    iguais = sum(1 for c in chaves if pedido.get(c) and teto.get(c))
    pedidos = sum(1 for c in chaves if pedido.get(c))
    if iguais == 2:
        return "garantida"
    if pedidos >= 1:
        return "intermediaria"
    return "oportunista"


def pedido_por_medicao(medicao: float, margem: float) -> float:
    """Request recalculado por medida, nunca copiado de outro servico (AT-021)."""
    return medicao * (1.0 + margem)


def replicas_desejadas(atuais: int, metrica: float, alvo: float) -> int:
    """Regra do HPA: teto de atuais*(metrica/alvo); sem request nao ha denominador."""
    if atuais < 1 or alvo <= 0.0:
        return 1
    return max(1, math.ceil(atuais * metrica / alvo))


def estabilizar(desejadas: int, minimo: int, maximo: int) -> int:
    """Prende a saida do loop na capacidade contratada: sem thrash fora da faixa."""
    return min(max(desejadas, minimo), maximo)


def disrupcao_permitida(replicas: int, removendo: int, minimo_pdb: int) -> bool:
    """PDB limita disrupcao voluntaria: sobra apos remocao respeita o minimo."""
    return replicas - removendo >= minimo_pdb


def espalhadas_ok(distribuicao: list[int]) -> bool:
    """Mais de uma replica no mesmo no nao e alta disponibilidade (AT-022)."""
    total = sum(distribuicao)
    if total <= 1:
        return True
    ocupados = sum(1 for n in distribuicao if n >= 1)
    return ocupados >= 2


def concluir_no_prazo(duracoes: list[float], prazo: float) -> dict[str, int]:
    """Shutdown sob carga sem relogio: conclui o que cabe, cancela o resto."""
    concluidas = sum(1 for d in duracoes if d <= prazo)
    return {"concluidas": concluidas, "canceladas": len(duracoes) - concluidas}


def escala_permitida(upstream_saturado: bool) -> bool:
    """Upstream saturado nega escala: autoscaling nao amplifica o gargalo."""
    return not upstream_saturado
