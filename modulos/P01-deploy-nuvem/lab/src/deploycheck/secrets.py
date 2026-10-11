"""Heurísticas de segredo literal, compartilhadas pelos três verificadores."""

import re

# Nomes de variável que, por convenção, carregam credencial.
SECRET_NAME = re.compile(
    r"(SECRET|PASSWORD|PASSWD|TOKEN|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY)", re.I
)

# Formatos de credencial reconhecíveis pelo valor, independente do nome.
SECRET_VALUE = (
    ("chave de conta/Storage (base64 longo terminando em ==)", re.compile(r"[A-Za-z0-9+/]{40,}==")),
    ("token do GitHub", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b")),
    ("chave privada PEM", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("chave sk- de provedor de modelo", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b")),
    ("AccountKey em connection string", re.compile(r"AccountKey=[^;\s]{20,}", re.I)),
    (
        "InstrumentationKey literal sem ser a connection string da plataforma",
        re.compile(r"SharedAccessKey=[^;\s]{20,}", re.I),
    ),
)


def is_dynamic(value: str) -> bool:
    """Valor vindo de expressão (Bicep `${}`/identificador, Actions `${{ }}`, ARG/`$VAR`)."""
    v = value.strip()
    return not v or "${{" in v or v.startswith("$") or "${" in v or "secrets." in v


def looks_like_secret_value(value: str) -> str | None:
    for label, pattern in SECRET_VALUE:
        if pattern.search(value):
            return label
    return None
