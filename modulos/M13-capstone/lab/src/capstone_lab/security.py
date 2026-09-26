"""Hardening de segurança e isolamento de tenant (M13 B12).

Invariantes:
- Nenhum controle depende só de prompt/regex no texto do modelo: os controles
  aqui são de **código e dado** (escopo de tenant na query, filtro de conteúdo
  no índice, assinatura HMAC, validação de caminho).
- Comparação de segredos é sempre ``hmac.compare_digest`` (tempo constante);
  ``==`` em assinatura é bug de segurança, não estilo.
- Redaction é feita na borda de saída (log/telemetria), antes de qualquer
  persistência: segredo nem chega a existir fora do processo.
- Threat model e risco residual vivem em ``lab/docs/threat-model.md``; o teste
  garante que o documento cobre as categorias e aponta para estes símbolos.
"""

from __future__ import annotations

import hashlib
import hmac
import re
from pathlib import Path

SECRET_PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|token|password|secret|authorization)\s*[:=]\s*\S+"),
    re.compile(r"\bsk-[A-Za-z0-9]{8,}\b"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
]
INJECTION_SIGNALS = (
    "ignore todas as instru",
    "ignore all previous",
    "system prompt",
    "reveal your instructions",
    "imprima a chave",
)


class TenantViolationError(Exception):
    """Recurso acessado fora do escopo do tenant autenticado."""


def redact_secrets(text: str) -> str:
    """Remove segredos do texto antes de log/telemetria; irreversível."""
    out = text
    for pattern in SECRET_PATTERNS:
        out = pattern.sub("[REDACTED]", out)
    return out


def contains_injection(text: str) -> bool:
    """Detector determinístico de sinais de prompt injection (defesa em código).

    Não substitui o controle de pipeline (chunks ``poisoned`` nem entram no
    índice, ver ``evals.build_index``); é a segunda camada, auditável.
    """
    low = text.lower()
    return any(sig in low for sig in INJECTION_SIGNALS)


def safe_member_path(name: str) -> Path:
    """Valida nome de arquivo extraído de artefato externo (anti path traversal)."""
    p = Path(name)
    if p.is_absolute() or ".." in p.parts or "\x00" in name:
        raise ValueError(f"member inseguro: {name!r}")
    return p


def sign_webhook(secret: bytes, body: bytes) -> str:
    return hmac.new(secret, body, hashlib.sha256).hexdigest()


def verify_webhook(secret: bytes, body: bytes, signature: str) -> bool:
    """Verificação de assinatura em tempo constante (HMAC-SHA256)."""
    expected = sign_webhook(secret, body)
    return hmac.compare_digest(expected, signature)


def assert_tenant(resource_tenant: int, caller_tenant: int) -> None:
    """Guard explícito: recurso de outro tenant nunca é servido."""
    if resource_tenant != caller_tenant:
        raise TenantViolationError(
            f"recurso do tenant {resource_tenant} fora do escopo de {caller_tenant}"
        )
