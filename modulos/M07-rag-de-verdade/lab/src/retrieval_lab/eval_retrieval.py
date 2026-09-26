"""Métricas de recuperação e ablação, sem LLM (lote M07).

recall@k, MRR e citação válida são determinísticos — e a citação válida
é a vantagem do corpus de código: linha existe ou não existe. `ablacao`
roda o pipeline desligando uma peça por vez e mostra o custo de cada
omissão: a evidência contra "embedar e buscar".
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path


def recall_at_k(recuperados: list[str], corretos: set[str], k: int) -> float:
    """Fração dos corretos entre os k primeiros (1.0 se nada esperado)."""
    if not corretos:
        return 1.0
    return len(set(recuperados[:k]) & corretos) / len(corretos)


def mrr(recuperados: list[str], corretos: set[str]) -> float:
    """1/posição do primeiro acerto (0 se nenhum)."""
    for i, cid in enumerate(recuperados, start=1):
        if cid in corretos:
            return 1.0 / i
    return 0.0


def citacao_valida(citacao: dict[str, object], raiz: Path) -> tuple[bool, str]:
    """A citação aponta para linhas que EXISTEM e contêm o termo?"""
    caminho = raiz / str(citacao["caminho"])
    if not caminho.is_file():
        return False, f"arquivo citado não existe: {citacao['caminho']}"
    linhas = caminho.read_text(encoding="utf-8", errors="replace").splitlines()
    ini, fim = citacao["linha_ini"], citacao["linha_fim"]
    assert isinstance(ini, int) and isinstance(fim, int)
    if not (1 <= ini <= fim <= len(linhas)):
        return False, f"faixa {ini}-{fim} fora do arquivo (1..{len(linhas)})"
    trecho = "\n".join(linhas[ini - 1 : fim]).lower()
    termo = str(citacao.get("termo_esperado", "")).lower()
    if termo and termo not in trecho:
        return False, f"trecho citado não contém '{termo}'"
    return True, ""


Configuracao = Callable[[str], list[str]]


def ablacao(
    consultas: list[tuple[str, set[str]]], configuracoes: dict[str, Configuracao], k: int = 5
) -> dict[str, float]:
    """recall@k médio por configuração: o preço de cada peça omitida."""
    return {
        nome: sum(recall_at_k(fn(q), esperados, k) for q, esperados in consultas) / len(consultas)
        for nome, fn in configuracoes.items()
    }
