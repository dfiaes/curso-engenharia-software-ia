"""Register of one AI system. Closed schema: unknown keys are errors, not silence."""

from datetime import date
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Slug = Annotated[str, StringConstraints(pattern=r"^[a-z0-9][a-z0-9-]{2,63}$")]
Country = Annotated[str, StringConstraints(pattern=r"^[A-Z]{2}$")]


class Closed(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class RiskTier(StrEnum):
    """Internal classification, modelled on the EU AI Act risk tiers."""

    PROHIBITED = "prohibited"
    HIGH = "high"
    LIMITED = "limited"
    MINIMAL = "minimal"


class Lifecycle(StrEnum):
    DRAFT = "draft"
    PILOT = "pilot"
    PRODUCTION = "production"
    RETIRED = "retired"


class LegalBasis(StrEnum):
    """LGPD art. 7 (I-X), plus the art. 11 II(g) basis that exists only for sensitive data."""

    CONSENT = "consent"
    LEGAL_OBLIGATION = "legal_obligation"
    PUBLIC_POLICY = "public_policy"
    RESEARCH = "research"
    CONTRACT = "contract"
    LEGAL_PROCESS = "legal_process"
    LIFE_PROTECTION = "life_protection"
    HEALTH_PROTECTION = "health_protection"
    LEGITIMATE_INTEREST = "legitimate_interest"
    CREDIT_PROTECTION = "credit_protection"
    FRAUD_PREVENTION = "fraud_prevention"


# LGPD art. 11: consent (I) or the hypotheses of II (a-g). Contract, legitimate interest
# and credit protection are art. 7 bases that do NOT apply to sensitive personal data.
SENSITIVE_BASES = frozenset(
    {
        LegalBasis.CONSENT,
        LegalBasis.LEGAL_OBLIGATION,
        LegalBasis.PUBLIC_POLICY,
        LegalBasis.RESEARCH,
        LegalBasis.LEGAL_PROCESS,
        LegalBasis.LIFE_PROTECTION,
        LegalBasis.HEALTH_PROTECTION,
        LegalBasis.FRAUD_PREVENTION,
    }
)


class StoreKind(StrEnum):
    PROMPT_LOG = "prompt_log"
    VECTOR_STORE = "vector_store"
    FINETUNE_DATASET = "finetune_dataset"
    EVAL_DATASET = "eval_dataset"
    CACHE = "cache"
    OTHER = "other"


class AssessmentKind(StrEnum):
    IMPACT = "impact"  # algorithmic / fundamental-rights impact assessment
    DPIA = "dpia"  # RIPD, relatorio de impacto a protecao de dados pessoais
    EVAL_REPORT = "eval_report"
    RED_TEAM = "red_team"
    MODEL_CARD = "model_card"


class DataStore(Closed):
    kind: StoreKind
    holds_personal_data: bool
    retention_days: Annotated[int, Field(ge=1, le=3650)] | None = None
    erasure_supported: bool = False


class PersonalData(Closed):
    processes: bool
    categories: list[str] = Field(default_factory=list)
    sensitive: bool = False
    children: bool = False


class ModelProvider(Closed):
    name: Annotated[str, Field(min_length=2)]
    country: Country
    trains_on_inputs: bool
    transfer_mechanism: str | None = None


class Assessment(Closed):
    kind: AssessmentKind
    done_on: date
    reference: Annotated[str, Field(min_length=3)]


class AISystemRecord(Closed):
    id: Slug
    name: Annotated[str, Field(min_length=3)]
    owner: Annotated[str, Field(min_length=3)]
    purpose: Annotated[str, Field(min_length=20)]
    lifecycle: Lifecycle
    risk_tier: RiskTier
    risk_rationale: Annotated[str, Field(min_length=10)]
    personal_data: PersonalData
    legal_basis: LegalBasis | None = None
    stores: list[DataStore] = Field(default_factory=list)
    provider: ModelProvider
    assessments: list[Assessment] = Field(default_factory=list)
    automated_decision: bool = False
    human_review: bool = False
    user_facing_generative: bool = False
    ai_disclosure: bool = False
    incident_plan: str | None = None
    eu_exposure: bool = False
