"""Turn a breach into a *draft* ``intent.md``: evidence in, questions out.

Detection was deterministic; this file only prepares the skeleton a diagnosing agent (read-only
tools) completes. The result must pass the same ``validate_intent`` as a human-written intent.
"""

from __future__ import annotations

from sdlc_kit.anomaly import Breach
from sdlc_kit.bands import Bands, Tier


def diagnosis_intent(
    intent_id: str,
    bands: Bands,
    breach: Breach,
    tier: Tier,
    tail: list[float],
    when: str,
) -> str | None:
    """Return the markdown, or ``None`` for tiers that only log."""
    if tier.action == "log":
        return None
    if tier.action == "diagnose_readonly":
        mode = "diagnóstico somente leitura: nenhuma escrita, nenhum deploy"
    elif tier.via == "runbook":
        mode = f"pode propor acionar o runbook pré-aprovado '{tier.runbook}'; humano autoriza"
    else:
        mode = "pode propor correção como PR que passa pelo gate de revisão"
    values = ", ".join(f"{v:g}" for v in tail)
    return f"""---
id: {intent_id}
status: draft
author: detector
origin: monitor
metric: {bands.metric}
rule: {breach.rule}
tier: {tier.name}
detected_at: {when}
---

# Diagnóstico: {bands.metric} ({breach.rule}, {tier.name})

## Problema

A métrica `{bands.metric}` violou a regra {breach.rule} ({breach.direction}, z = {breach.z:.2f})
em {when}.
Últimos valores: {values}.

## Resultado esperado

Causa provável identificada com evidência (logs, deploys, mudanças de configuração)
e uma recomendação: corrigir agora, agendar ou descartar. Modo: {mode}.

## Usuários e sistemas

Dono do serviço que emite `{bands.metric}`; sistemas cobertos pelo monitor e
pipeline de deploy recente.

## Restrições

Ferramentas de leitura apenas até o dono do serviço triar. Qualquer escrita chega
como PR e passa pela revisão.

## Questões em aberto

- Qual mudança (deploy, configuração, dependência, tráfego) coincide com o início do desvio?
- O desvio é real ou efeito de coleta/instrumentação?
"""
