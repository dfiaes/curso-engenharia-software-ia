"""Deadline end-to-end com orçamento por fase e retry só quando seguro.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (time).
Relógio injetado pelo chamador: teste com relógio controlado.
"""

from __future__ import annotations

from collections.abc import Callable

METODOS_REPETIVEIS = frozenset({"GET", "HEAD", "OPTIONS", "PUT", "DELETE"})


class PrazoEstourado(TimeoutError):
    """Fase ou operação além do orçamento contratado."""


def orcamento_por_fase(prazo_total: float, pesos: dict[str, float]) -> dict[str, float]:
    """Divide o prazo total em orçamentos proporcionais aos pesos.

    Pesos precisam ser positivos; a soma dos orçamentos fecha no total.
    """
    if not prazo_total > 0:
        raise ValueError("prazo_total precisa ser positivo")
    if not pesos:
        raise ValueError("pesos vazio não orça fase alguma")
    total_pesos = 0.0
    for peso in pesos.values():
        if not peso > 0:
            raise ValueError("todo peso precisa ser positivo")
        total_pesos += peso
    return {fase: prazo_total * peso / total_pesos for fase, peso in pesos.items()}


def restante(inicio: float, prazo_total: float, agora: float) -> float:
    """Segundos que faltam do deadline; nunca negativo."""
    falta = inicio + prazo_total - agora
    return falta if falta > 0 else 0.0


def checar_prazo(inicio: float, prazo_total: float, agora: float) -> None:
    """Levanta PrazoEstourado quando o deadline já passou."""
    if agora - inicio >= prazo_total:
        raise PrazoEstourado(f"deadline de {prazo_total}s excedido")


def executar_fase[T](
    orcamento_fase: float,
    inicio: float,
    prazo_total: float,
    agora: Callable[[], float],
    trabalho: Callable[[float], T],
) -> T:
    """Executa o trabalho com o menor entre orçamento da fase e restante.

    Checa o deadline antes e depois; estouro vira PrazoEstourado.
    O trabalho recebe os segundos disponíveis e respeita o teto.
    """
    checar_prazo(inicio, prazo_total, agora())
    disponivel = restante(inicio, prazo_total, agora())
    teto = orcamento_fase if orcamento_fase < disponivel else disponivel
    saida = trabalho(teto)
    checar_prazo(inicio, prazo_total, agora())
    return saida


def pode_repetir(metodo: str, tentativa: int, max_tentativas: int, restante_seg: float) -> bool:
    """Retry só quando seguro: idempotente, dentro do teto e com prazo.

    POST e método fora do conjunto repetível nunca repetem;
    sem prazo restante, nunca.
    """
    if tentativa >= max_tentativas:
        return False
    if restante_seg <= 0:
        return False
    return metodo.strip().upper() in METODOS_REPETIVEIS
