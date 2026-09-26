"""Runbook exercitado contra degradacao simulada local.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (dataclasses, collections.abc).
O alvo degrada por modo declarado; mitigar contem, nunca apaga o sinal.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field

MODOS = ("saudavel", "latencia_alta", "erros_altos")
ACOES = ("conter_entrada", "reverter_mudanca", "isolar_upstream")


@dataclass
class AlvoLocal:
    """Degradacao simulada local: modo declarado, leitura por dicionario."""

    modo: str = "saudavel"
    mitigado: bool = False

    def __post_init__(self) -> None:
        if self.modo not in MODOS:
            raise ValueError(f"modo precisa estar em {MODOS}")

    def observar(self) -> dict[str, float]:
        """Publica p95_ms e taxa_erro do modo atual; exemplo variavel."""
        if self.modo == "latencia_alta":
            return {"p95_ms": 900.0, "taxa_erro": 0.01}
        if self.modo == "erros_altos":
            return {"p95_ms": 120.0, "taxa_erro": 0.25}
        return {"p95_ms": 80.0, "taxa_erro": 0.001}

    def aplicar_mitigacao(self, acao: str) -> dict[str, str]:
        """Contem o impacto com acao do vocabulario; fora dele: ValueError."""
        if acao not in ACOES:
            raise ValueError(f"acao precisa estar em {ACOES}")
        self.mitigado = True
        return {"acao": acao, "efeito": "impacto_contido_causa_aberta"}


@dataclass
class Passo:
    """Passo do runbook: nome e sinal esperado antes da leitura."""

    nome: str
    sinal_esperado: str


@dataclass
class ResultadoPasso:
    """Conformidade de um passo: o observado contra o esperado."""

    nome: str
    conforme: bool
    observado: dict[str, float] = field(default_factory=dict)


def executar_passo(
    alvo: AlvoLocal, passo: Passo, checagem: Callable[[dict[str, float]], bool]
) -> ResultadoPasso:
    """Executa um passo contra o alvo e publica a conformidade."""
    if not passo.nome.strip() or not passo.sinal_esperado.strip():
        raise ValueError("passo precisa de nome e sinal_esperado")
    observado = alvo.observar()
    return ResultadoPasso(passo.nome, bool(checagem(observado)), observado)


def veredito_runbook(resultados: list[ResultadoPasso]) -> str:
    """Mitigado só com lista não vazia e todos os passos conformes."""
    if not resultados:
        raise ValueError("runbook vazio não tem veredito")
    if all(resultado.conforme for resultado in resultados):
        return "mitigado"
    return "nao_mitigado"
