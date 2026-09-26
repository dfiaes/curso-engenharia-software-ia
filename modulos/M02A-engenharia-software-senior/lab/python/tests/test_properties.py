"""Oráculos B08-L: propriedades, mutante P0, defeitos por gate e diferencial.

Recorte M02A-B08-L (depende de B08-C): pirâmide por risco sobre a fronteira
JSON → domínio e sobre política/idempotência. Hypothesis é a ferramenta do
recorte porque consta do grupo dev de ``lab/pyproject.toml`` e do ``uv.lock``
(6.165.9); todos os testes gerativos fixam seed explícito e registram
amostra e digest em ``python/evidence/b08l-testes.json``.

Oráculos independentes (nunca a saída congelada da implementação):

- normalização de dinheiro: grafias decimais equivalentes produzem o mesmo
  hash de intenção (especificação: invariante quantizado em 0.01);
- normalização de intenção: variantes com padding de whitespace produzem o
  mesmo hash (o canônico aplica ``strip``; caixa NÃO é dobrada — alegar
  case-insensitividade seria claim além do recorte);
- idempotência: normalizar duas vezes equivale a normalizar uma vez;
  mesma chave + mesma intenção reutiliza; mesma chave + intenção distinta
  conflita (``IdempotencyConflict``);
- AT-029: cada propriedade é acompanhada do contraexemplo mínimo e
  reproduzível que ela caça, executado contra variante quebrada local;
- AT-030: mutante que remove a escalada P0 por risco do advisor é morto
  pelo oráculo da especificação (sem módulo novo; falha semeada reversível);
- AT-031: defeito de tipo falha no gate de contrato, defeito semântico no
  gate de política e cancelamento ignorado no gate de runtime;
- diferencial: fronteira estrita (``application/boundary.py``) contra
  construção direta do domínio (``domain/models.py``) sobre o mesmo corpus
  com seed; compara valores normalizados e motivos de rejeição, nunca texto
  livre. O corte API contra CLI instalada pertence ao B14.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import random
from dataclasses import replace
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from hypothesis import given, seed, settings
from hypothesis import strategies as st
from work_intake.adapters.advisor import FakeAdvisor
from work_intake.application.boundary import BoundaryError, parse_work_request_json
from work_intake.application.bounded_batch import run_bounded_batch
from work_intake.application.service import EvaluateWorkRequest, IdempotencyConflict
from work_intake.domain.models import (
    AdvisorIdentity,
    Advisory,
    AdvisoryCategory,
    Decision,
    EvaluationResult,
    Outcome,
    Priority,
    Risk,
    WorkRequest,
)
from work_intake.domain.policy import IntakePolicy
from work_intake.ports.repository import StoredEvaluation

SEED_B08 = 20260919
HYPOTHESIS_MAX_EXAMPLES = 64
GENERATED_VALID_CASES = 64
B08_CORPUS_DIGEST = "a097fab74451657e6c26dd704e74193cd419e2c5aac55ca24016fd045abca4d4"
LAB_ROOT = Path(__file__).resolve().parents[2]

_INTENTS = (
    "Revisar documentação interna.",
    "Automatizar a triagem de solicitações.",
    "Ação de segurança e operação.",
    "Entregar relatório mensal de incidentes.",
)
_PADDINGS = ("", " ", "  ", "\t", "\n", " \t\n ")


def _canon_budget_text(value: str) -> str:
    """Grafia canônica do dinheiro: a mesma normalização do ``intent_hash``."""
    return format(Decimal(value).quantize(Decimal("0.01")), "f")


def _canon_intent_text(value: str) -> str:
    """Intenção canônica: a mesma normalização do ``intent_hash``."""
    return value.strip()


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
    """Advisor confiante (condição semeada): nunca pode revogar política P0."""

    @property
    def identity(self) -> AdvisorIdentity:
        return AdvisorIdentity(adapter="optimistic-b08", version="1.0")

    def advise(self, request: WorkRequest) -> Advisory:
        del request
        return Advisory(
            category=AdvisoryCategory.DELIVERY,
            risk=Risk.LOW,
            confidence=Decimal("1"),
            signals=("approve_everything",),
        )


class _MutantPolicyWithoutEscalation(IntakePolicy):
    """Falha semeada reversível (AT-030): copia a política sem a escalada P0."""

    def decide(self, request: WorkRequest, advisory: Advisory) -> Decision:
        del advisory
        if request.priority is Priority.CRITICAL:
            outcome = Outcome.REJECT
            reasons = ["critical_requires_manual_channel"]
        elif request.budget > self.reject_budget:
            outcome = Outcome.REJECT
            reasons = ["budget_limit_exceeded"]
        elif request.priority is Priority.HIGH or request.budget > self.review_budget:
            outcome = Outcome.REVIEW
            reasons = ["deterministic_review_required"]
        else:
            outcome = Outcome.ACCEPT
            reasons = ["deterministic_policy_passed"]
        return Decision(
            request_id=request.request_id,
            outcome=outcome,
            reason_codes=tuple(reasons),
            policy_version=self.version,
            contract_version=request.contract_version,
        )


def _absorb_as_repetition(first: WorkRequest, second: WorkRequest) -> bool:
    """Oráculo quebrado (AT-029): compara só chave, ignora a intenção."""
    return (first.tenant_id, first.idempotency_key) == (
        second.tenant_id,
        second.idempotency_key,
    )


def _base_request() -> WorkRequest:
    return parse_work_request_json(
        (LAB_ROOT / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )


def _valid_payload(index: int, rng: random.Random) -> dict[str, Any]:
    reais = rng.randrange(0, 1_000_000)
    centavos = rng.randrange(0, 100)
    spelling = rng.choice(("plain", "dec1", "dec2"))
    if spelling == "plain" and centavos != 0:
        spelling = "dec2"
    if spelling == "plain":
        budget = f"{reais}"
    elif spelling == "dec1":
        budget = f"{reais}.{centavos // 10}"
    else:
        budget = f"{reais}.{centavos:02d}"
    base_intent = rng.choice(_INTENTS)
    intent = rng.choice(_PADDINGS) + base_intent + rng.choice(_PADDINGS)
    instant = datetime(2026, 9, 1, 12, 0, 0, tzinfo=UTC)
    if rng.randrange(2) == 0:
        deadline = instant.strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        shifted = instant.replace(hour=9)
        deadline = shifted.strftime("%Y-%m-%dT%H:%M:%S") + "-03:00"
    tag = f"{index:04d}-{rng.randrange(0, 2**32):08x}"
    return {
        "schema_version": "1.0",
        "request_id": f"req-b08-{tag}",
        "tenant_id": "tenant-acme",
        "intent": intent,
        "priority": rng.choice(["low", "normal", "high", "critical"]),
        "budget": budget,
        "deadline_at": deadline,
        "idempotency_key": f"idem-b08-{tag}",
    }


def _golden_payloads(lab_root: Path) -> list[dict[str, Any]]:
    payloads: list[dict[str, Any]] = []
    for name in ("fixtures/golden/request-v1.json", "fixtures/compatibility/request-v2.json"):
        raw: dict[str, Any] = json.loads((lab_root / name).read_text(encoding="utf-8"))
        payloads.append(raw)
    return payloads


def _invalid_cases(lab_root: Path) -> list[tuple[str, dict[str, Any], tuple[str, ...]]]:
    base: dict[str, Any] = json.loads(
        (lab_root / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )

    def variant(**changes: Any) -> dict[str, Any]:
        payload = dict(base)
        payload.update(changes)
        return payload

    extra = variant()
    extra["is_admin"] = True
    return [
        ("budget-numero", variant(budget=750.00), ("budget",)),
        ("budget-tres-casas", variant(budget="750.123"), ("budget",)),
        ("budget-negativo", variant(budget="-5.00"), ("budget",)),
        ("intent-branco", variant(intent="   "), ("intent",)),
        ("schema-desconhecida", variant(schema_version="3.0"), ("schema_version",)),
        ("campo-extra", extra, ("is_admin",)),
        ("deadline-sem-tz", variant(deadline_at="2026-09-01T12:00:00"), ("deadline_at",)),
        ("idem-curta", variant(idempotency_key="x"), ("idempotency_key",)),
        ("prioridade-fora", variant(priority="urgent"), ("priority",)),
    ]


def _corpus_entries(
    lab_root: Path,
) -> tuple[list[dict[str, Any]], list[tuple[str, dict[str, Any], tuple[str, ...]]]]:
    rng = random.Random(SEED_B08)
    valid = _golden_payloads(lab_root)
    valid.extend(_valid_payload(i, rng) for i in range(GENERATED_VALID_CASES))
    invalid = _invalid_cases(lab_root)
    return valid, invalid


def _corpus_digest(lab_root: Path) -> str:
    valid, invalid = _corpus_entries(lab_root)
    lines = [
        json.dumps(p, sort_keys=True, separators=(",", ":"), ensure_ascii=False) for p in valid
    ]
    lines.extend(
        json.dumps(
            {"expected": list(expected), "name": name, "payload": payload},
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        )
        for name, payload, expected in invalid
    )
    return hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()


def _to_domain_direct(payload: dict[str, Any]) -> WorkRequest:
    version = str(payload["schema_version"])
    source = payload.get("source") if version == "2.0" else None
    return WorkRequest(
        contract_version=version,
        request_id=str(payload["request_id"]),
        tenant_id=str(payload["tenant_id"]),
        intent=str(payload["intent"]),
        priority=Priority(str(payload["priority"])),
        budget=Decimal(str(payload["budget"])),
        deadline_at=datetime.fromisoformat(str(payload["deadline_at"]).replace("Z", "+00:00")),
        idempotency_key=str(payload["idempotency_key"]),
        source=source,
    )


@seed(SEED_B08)
@settings(max_examples=HYPOTHESIS_MAX_EXAMPLES, derandomize=True, database=None)
@given(
    reais=st.integers(min_value=0, max_value=999_999),
    centavos=st.integers(min_value=0, max_value=99),
)
def test_money_spellings_share_intent_hash(reais: int, centavos: int) -> None:
    """Grafias do mesmo valor produzem o mesmo hash (oráculo: invariante 0.01)."""
    base = _base_request()
    explicit = f"{reais}.{centavos:02d}"
    if centavos == 0:
        minimal = f"{reais}"
    elif centavos % 10 == 0:
        minimal = f"{reais}.{centavos // 10}"
    else:
        minimal = explicit
    first = replace(base, budget=Decimal(explicit))
    second = replace(base, budget=Decimal(minimal))
    assert _canon_budget_text(explicit) == _canon_budget_text(minimal)
    assert first.intent_hash == second.intent_hash


@seed(SEED_B08)
@settings(max_examples=HYPOTHESIS_MAX_EXAMPLES, derandomize=True, database=None)
@given(
    base=st.sampled_from(_INTENTS),
    pre=st.sampled_from(_PADDINGS),
    post=st.sampled_from(_PADDINGS),
)
def test_intent_padding_variants_share_canonical_hash(base: str, pre: str, post: str) -> None:
    """Padding de whitespace não muda a intenção canônica (oráculo: ``strip``)."""
    request = _base_request()
    padded = replace(request, intent=f"{pre}{base}{post}")
    plain = replace(request, intent=base)
    assert _canon_intent_text(padded.intent) == base
    assert padded.intent_hash == plain.intent_hash


@seed(SEED_B08)
@settings(max_examples=HYPOTHESIS_MAX_EXAMPLES, derandomize=True, database=None)
@given(
    reais=st.integers(min_value=0, max_value=999_999),
    centavos=st.integers(min_value=0, max_value=99),
    base=st.sampled_from(_INTENTS),
    pre=st.sampled_from(_PADDINGS),
    post=st.sampled_from(_PADDINGS),
)
def test_canonicalization_is_idempotent(
    reais: int, centavos: int, base: str, pre: str, post: str
) -> None:
    """Normalizar duas vezes equivale a normalizar uma vez (forma executável)."""
    money = f"{reais}.{centavos:02d}"
    intent = f"{pre}{base}{post}"
    assert _canon_budget_text(_canon_budget_text(money)) == _canon_budget_text(money)
    assert _canon_intent_text(_canon_intent_text(intent)) == _canon_intent_text(intent)


@seed(SEED_B08)
@settings(max_examples=HYPOTHESIS_MAX_EXAMPLES, derandomize=True, database=None)
@given(suffix=st.text(alphabet="abcdefghijklmnopqrstuvwxyz0123456789", min_size=8, max_size=16))
def test_idempotency_repetition_reuses_and_collision_conflicts(suffix: str) -> None:
    """Mesma chave+intenção reutiliza; intenção distinta conflita (oráculo: serviço)."""
    first = WorkRequest(
        contract_version="1.0",
        request_id="req-b08-idem-prop",
        tenant_id="tenant-acme",
        intent="Revisar documentação interna.",
        priority=Priority.NORMAL,
        budget=Decimal("100.00"),
        deadline_at=datetime(2026, 9, 1, 12, 0, 0, tzinfo=UTC),
        idempotency_key=f"idem-{suffix}",
        source=None,
    )
    service = EvaluateWorkRequest(repository=_MemoryRepository(), advisor=FakeAdvisor())
    stored = service.execute(first)
    repeated = service.execute(first)
    assert stored.reused is False
    assert repeated.reused is True
    assert repeated.advisor_calls == 0
    assert repeated.decision == stored.decision
    diverged = replace(
        first, request_id="req-b08-idem-colisao", intent="Entregar relatório distinto."
    )
    assert diverged.intent_hash != first.intent_hash
    with pytest.raises(IdempotencyConflict):
        service.execute(diverged)


def test_at029_broken_scale_counterexample_is_caught() -> None:
    """AT-029: escala que muda o hash sem mudar o valor é contraexemplo mínimo."""
    base = _base_request()
    thin = replace(base, budget=Decimal("750.0"))
    wide = replace(base, budget=Decimal("750.00"))
    broken_thin = hashlib.sha256(str(thin.budget).encode("utf-8")).hexdigest()
    broken_wide = hashlib.sha256(str(wide.budget).encode("utf-8")).hexdigest()
    assert broken_thin != broken_wide  # variante sem quantize diverge: bug detectável
    assert thin.intent_hash == wide.intent_hash  # implementação real normaliza


def test_at029_broken_trim_counterexample_is_caught() -> None:
    """AT-029: trim aplicado num caminho e esquecido no outro é contraexemplo."""
    base = _base_request()
    padded = replace(base, intent="  Revisar documentação interna.  ")
    plain = replace(base, intent="Revisar documentação interna.")
    assert (
        hashlib.sha256(padded.intent.encode("utf-8")).hexdigest()
        != hashlib.sha256(plain.intent.encode("utf-8")).hexdigest()
    )
    assert padded.intent_hash == plain.intent_hash


def test_at029_absorbed_collision_counterexample_is_caught() -> None:
    """AT-029: colisão absorvida como repetição é pega pelo conflito explícito."""
    base = _base_request()
    first = replace(base, intent="Entregar relatório X.")
    second = replace(first, request_id="req-b08-colisao-002", intent="Entregar relatório Y.")
    assert first.intent_hash != second.intent_hash
    assert _absorb_as_repetition(first, second) is True  # oráculo quebrado absorveria
    service = EvaluateWorkRequest(repository=_MemoryRepository(), advisor=FakeAdvisor())
    service.execute(first)
    with pytest.raises(IdempotencyConflict):
        service.execute(second)


@pytest.mark.parametrize("risk", [Risk.MEDIUM, Risk.HIGH, Risk.UNKNOWN])
def test_at030_mutant_removing_p0_escalation_is_killed(risk: Risk) -> None:
    """AT-030: mutante sem escalada P0 aprova; o oráculo exige REVIEW e o mata."""
    advisory = Advisory(
        category=AdvisoryCategory.DELIVERY,
        risk=risk,
        confidence=Decimal("0.9"),
        signals=("rotina",),
    )
    request = replace(
        _base_request(),
        priority=Priority.NORMAL,
        budget=Decimal("100.00"),
    )
    correct = IntakePolicy().decide(request, advisory)
    assert correct.outcome is Outcome.REVIEW
    assert "advisor_risk_escalation" in correct.reason_codes
    mutant = _MutantPolicyWithoutEscalation().decide(request, advisory)
    assert mutant.outcome is Outcome.ACCEPT  # mutante sobreviveria sem este oráculo


def test_at031_type_defect_fails_in_contract_gate(lab_root: Path) -> None:
    """AT-031: tipo fora do contrato falha no gate de tipos/contrato, com campo."""
    raw: dict[str, Any] = json.loads(
        (lab_root / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )
    numeric = dict(raw)
    numeric["budget"] = 750.00
    with pytest.raises(BoundaryError) as budget_capture:
        parse_work_request_json(json.dumps(numeric))
    assert budget_capture.value.fields == ("budget",)
    blank = dict(raw)
    blank["intent"] = "   "
    with pytest.raises(BoundaryError) as intent_capture:
        parse_work_request_json(json.dumps(blank))
    assert intent_capture.value.fields == ("intent",)


def test_at031_semantic_defect_fails_in_policy_gate() -> None:
    """AT-031: advisory confiante não revoga rejeição crítica (gate de política)."""
    critical = replace(_base_request(), priority=Priority.CRITICAL)
    result = EvaluateWorkRequest(
        repository=_MemoryRepository(), advisor=_OptimisticAdvisor()
    ).execute(critical)
    assert result.decision.outcome is Outcome.REJECT
    assert "critical_requires_manual_channel" in result.decision.reason_codes


def test_at031_cancel_ignored_fails_in_runtime_gate() -> None:
    """AT-031: cancelamento externo executa cleanup (gate de runtime observado)."""
    started = asyncio.Event()
    worker_cleaned = asyncio.Event()

    async def blocking_worker(_: int) -> None:
        started.set()
        try:
            await asyncio.Event().wait()
        finally:
            worker_cleaned.set()

    async def scenario() -> None:
        batch = asyncio.create_task(
            run_bounded_batch([1], capacity=1, admission_timeout=5, worker=blocking_worker)
        )
        await started.wait()
        batch.cancel()
        with pytest.raises(asyncio.CancelledError):
            await batch

    asyncio.run(asyncio.wait_for(scenario(), timeout=10))
    assert worker_cleaned.is_set()


def test_differential_boundary_and_domain_agree_over_seeded_corpus(
    lab_root: Path,
) -> None:
    """Diferencial: fronteira estrita e domínio direto concordam (seed fixo)."""
    valid, _ = _corpus_entries(lab_root)
    assert len(valid) == GENERATED_VALID_CASES + 2
    for payload in valid:
        via_boundary = parse_work_request_json(json.dumps(payload, ensure_ascii=False))
        via_domain = _to_domain_direct(payload)
        assert via_boundary.intent_hash == via_domain.intent_hash
        assert via_boundary.budget.quantize(Decimal("0.01")) == via_domain.budget.quantize(
            Decimal("0.01")
        )
        assert via_boundary.deadline_at.astimezone(UTC).isoformat() == (
            via_domain.deadline_at.astimezone(UTC).isoformat()
        )
        assert (via_boundary.request_id, via_boundary.idempotency_key) == (
            via_domain.request_id,
            via_domain.idempotency_key,
        )


def test_differential_invalid_inputs_are_rejected_with_field_motive(
    lab_root: Path,
) -> None:
    """Diferencial negativo: rejeição indica o campo; divergência livre não conta."""
    _, invalid = _corpus_entries(lab_root)
    assert len(invalid) == 9
    by_name = {name: payload for name, payload, _ in invalid}
    for name, payload, expected in invalid:
        with pytest.raises(BoundaryError) as captured:
            parse_work_request_json(json.dumps(payload))
        assert captured.value.fields == expected, name
    # A fronteira é estrita por desenho; só deadline e budget mapeiam ao domínio.
    with pytest.raises(ValueError):
        _to_domain_direct(dict(by_name["deadline-sem-tz"]))
    with pytest.raises(ValueError):
        _to_domain_direct(dict(by_name["budget-negativo"]))


def test_b08_corpus_digest_is_frozen(lab_root: Path) -> None:
    """Corpus finito e auditável: seed, amostra e digest registrados na evidência."""
    digest = _corpus_digest(lab_root)
    assert digest == B08_CORPUS_DIGEST, f"digest real: {digest}"
