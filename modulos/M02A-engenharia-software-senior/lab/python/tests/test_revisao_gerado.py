"""Oráculos B15-L: cada família de defeito do gerado falha no seu gate.

Recorte M02A-B15-L (depende de B15-C; ES26-059; AT-031): fragmento gerado
por IA passa pelos mesmos gates do código humano — tipo fora do contrato
falha no gate de contrato com o campo, semântica que afrouxa regra falha
no gate de política com a proibição preservada, cancelamento ignorado
falha no gate de runtime com cleanup observado. Um alarme genérico que
"falha de algum jeito" não conta como oráculo.

Herança reutilizada por referência, sem reexecução neste módulo: o ciclo
de contenção AT-023-028 já tem evidência forte no slice pré-existente
(``test_policy.py``: mesma contract suite para fake e record-replay,
malformado rejeitado antes da política, injeção como dado inerte,
fallback em timeout/indisponível, proibição preservada; ``test_threat.py``:
precedência da proibição; evidência AT-028 com os cinco campos). Este
módulo só acrescenta os três gates de AT-031 mais o digest recalculável;
a suíte inteira é re-rodada no gate apenas para provar ausência de
regressão. Números e amostras são exemplo variável, válidos para
seed/famílias/digest abaixo.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
from dataclasses import replace
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from work_intake.application.boundary import BoundaryError, parse_work_request_json
from work_intake.application.bounded_batch import run_bounded_batch
from work_intake.application.service import EvaluateWorkRequest
from work_intake.domain.models import (
    AdvisorIdentity,
    Advisory,
    AdvisoryCategory,
    EvaluationResult,
    Outcome,
    Priority,
    Risk,
    WorkRequest,
)
from work_intake.ports.repository import StoredEvaluation

SEED_B15L = 20260915
FAMILIAS_B15L: tuple[str, ...] = (
    "tipo-fora-do-contrato",
    "semantica-que-afrouxa-regra",
    "cancelamento-ignorado",
)
DIGEST_B15L = "a0a97d98eae7fa54e8417e9f6b4b62b5f0045e1d24016bd51cb151cac2282994"


def _digest_familias(seed: int, familias: tuple[str, ...]) -> str:
    material = f"{seed}\n" + "\n".join(familias)
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


class _MemoryRepository:
    def __init__(self) -> None:
        self._items: dict[tuple[str, str], StoredEvaluation] = {}

    def find_by_idempotency(self, tenant_id: str, key: str) -> StoredEvaluation | None:
        return self._items.get((tenant_id, key))

    def save(self, request: WorkRequest, result: EvaluationResult) -> None:
        self._items[(request.tenant_id, request.idempotency_key)] = StoredEvaluation(
            intent_hash=request.intent_hash, result=result
        )


class _OptimisticAdvisor:
    """Gerado plausível semeado: confiança máxima pedindo aceite geral."""

    @property
    def identity(self) -> AdvisorIdentity:
        return AdvisorIdentity(adapter="gerado-otimista-b15", version="1.0")

    def advise(self, request: WorkRequest) -> Advisory:
        del request
        return Advisory(
            category=AdvisoryCategory.DELIVERY,
            risk=Risk.LOW,
            confidence=Decimal("1"),
            signals=("approve_everything",),
        )


def test_gerado_com_tipo_fora_do_contrato_falha_no_gate_de_contrato(
    lab_root: Path,
) -> None:
    """AT-031: budget numérico (fora do contrato) é rejeitado com o campo."""
    raw: dict[str, Any] = json.loads(
        (lab_root / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )
    sane = parse_work_request_json(json.dumps(raw))
    assert sane.request_id.startswith("req-")
    numerico = dict(raw)
    numerico["budget"] = 750.00
    with pytest.raises(BoundaryError) as capturado:
        parse_work_request_json(json.dumps(numerico))
    assert capturado.value.fields == ("budget",)


def test_gerado_com_semantica_afrouxada_falha_no_gate_de_politica(
    lab_root: Path,
) -> None:
    """AT-031: advisory confiante não revoga a rejeição crítica determinística."""
    base = parse_work_request_json(
        (lab_root / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )
    critico = replace(base, priority=Priority.CRITICAL)
    resultado = EvaluateWorkRequest(
        repository=_MemoryRepository(), advisor=_OptimisticAdvisor()
    ).execute(critico)
    assert resultado.decision.outcome is Outcome.REJECT
    assert "critical_requires_manual_channel" in resultado.decision.reason_codes


def test_gerado_que_ignora_cancelamento_falha_no_gate_de_runtime() -> None:
    """AT-031: cancelamento externo propaga e executa o cleanup observado."""
    iniciado = asyncio.Event()
    limpou = asyncio.Event()

    async def trabalhador_bloqueante(_: int) -> None:
        iniciado.set()
        try:
            await asyncio.Event().wait()
        finally:
            limpou.set()

    async def cenario() -> None:
        lote = asyncio.create_task(
            run_bounded_batch([1], capacity=1, admission_timeout=5.0, worker=trabalhador_bloqueante)
        )
        await iniciado.wait()
        lote.cancel()
        with pytest.raises(asyncio.CancelledError):
            await lote

    asyncio.run(asyncio.wait_for(cenario(), timeout=10))
    assert limpou.is_set()


def test_evidencia_b15l_tem_digest_congelado() -> None:
    """Evidência recalculável: seed mais famílias definem o digest; tamper quebra."""
    assert _digest_familias(SEED_B15L, FAMILIAS_B15L) == DIGEST_B15L
    assert len(DIGEST_B15L) == 64
    assert len(FAMILIAS_B15L) == 3
    assert len(set(FAMILIAS_B15L)) == 3
    assert _digest_familias(SEED_B15L, FAMILIAS_B15L[:-1]) != DIGEST_B15L
