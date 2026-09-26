"""Loop do investigador: 7 paradas, parcial honesta, HITL (lote M08).

Sem critério de parada, agente é fatura aberta: por isso orçamentos em
três dimensões (passos, custo, tempo), detector de loop estéril, erro
irrecuperável e pausa para aprovação — tudo antes de qualquer modelo.
"""

from __future__ import annotations

import time
from collections import Counter
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Literal

from agent_lab.policy import Action, Final, ScriptedPolicy
from agent_lab.tools import ToolDefinition

Parada = Literal[
    "sucesso",
    "orcamento_passos",
    "orcamento_custo",
    "orcamento_tempo",
    "loop_esteril",
    "erro_irrecuperavel",
    "requer_humano",
]


@dataclass(frozen=True, slots=True)
class Orcamento:
    max_passos: int = 12
    max_custo_usd: float = 0.50
    max_segundos: float = 120.0
    max_repeticoes: int = 3
    custo_por_passo: float = 0.01


@dataclass(slots=True)
class Execucao:
    resposta: str
    parada: Parada
    passos: int
    custo: float
    duracao_s: float
    fatos: list[str] = field(default_factory=list)
    chamadas: list[str] = field(default_factory=list)

    @property
    def parcial(self) -> bool:
        return self.parada != "sucesso"


Aprovacao = Callable[[str], bool]


def _parcial(fatos: list[str], motivo: str) -> str:
    if not fatos:
        return f"Não concluído ({motivo}) e sem fato verificável."
    linhas = "\n".join(f"- {f}" for f in fatos)
    return f"RESPOSTA PARCIAL ({motivo}).\n\nFatos estabelecidos:\n{linhas}"


async def investigar(
    pergunta: str,
    policy: ScriptedPolicy,
    tools: dict[str, ToolDefinition],
    orc: Orcamento | None = None,
    exige_aprovacao: Aprovacao | None = None,
) -> Execucao:
    """Planejar (política) → agir (tools) → observar → avaliar parada."""
    budget = orc or Orcamento()
    aprovar = exige_aprovacao or (lambda _nome: False)
    inicio = time.perf_counter()
    historico: list[dict[str, object]] = [{"role": "user", "content": pergunta}]
    custo = 0.0
    assinaturas: Counter[str] = Counter()
    fatos: list[str] = []
    chamadas: list[str] = []

    def encerrar(motivo: Parada, texto: str) -> Execucao:
        return Execucao(
            resposta=texto,
            parada=motivo,
            passos=len(chamadas),
            custo=custo_usd_round(custo),
            duracao_s=time.perf_counter() - inicio,
            fatos=fatos,
            chamadas=chamadas,
        )

    for _ in range(budget.max_passos):
        if custo >= budget.max_custo_usd:
            return encerrar("orcamento_custo", _parcial(fatos, "orçamento de custo esgotado"))
        if time.perf_counter() - inicio >= budget.max_segundos:
            return encerrar("orcamento_tempo", _parcial(fatos, "tempo esgotado"))

        acao: Action = policy.proximo(historico)
        custo += budget.custo_por_passo
        if isinstance(acao, Final):
            return encerrar("sucesso", acao.text)

        assinatura = f"{acao.name}({sorted(map(str, acao.arguments.items()))})"
        assinaturas[assinatura] += 1
        chamadas.append(acao.name)
        if assinaturas[assinatura] > budget.max_repeticoes:
            return encerrar("loop_esteril", _parcial(fatos, f"repetiu {acao.name} sem progresso"))
        if aprovar(acao.name):
            return encerrar("requer_humano", f"aprovação necessária para {acao.name}")

        ferramenta = tools.get(acao.name)
        if ferramenta is None:
            historico.append(
                {"role": "tool", "content": f"ERRO: ferramenta desconhecida: {acao.name}"}
            )
            if sum(1 for c in chamadas if c == acao.name) >= 2:
                return encerrar("erro_irrecuperavel", _parcial(fatos, f"{acao.name} inexistente"))
            continue
        try:
            saida: str = ferramenta.fn(dict(acao.arguments))
            historico.append({"role": "tool", "content": saida})
            if acao.name == "notas_registrar":
                fato = acao.arguments.get("fato", "")
                if fato:
                    fatos.append(str(fato))
        except Exception as exc:
            historico.append({"role": "tool", "content": f"ERRO de argumento: {exc}"})

    return encerrar("orcamento_passos", _parcial(fatos, "orçamento de passos esgotado"))


def custo_usd_round(valor: float) -> float:
    """Arredonda o custo acumulado para 6 casas (contabilidade, não float solto)."""
    return round(valor, 6)
