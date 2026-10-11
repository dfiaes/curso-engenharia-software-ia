"""Configuração por variáveis de ambiente, validada na partida (fail fast)."""

from collections.abc import Mapping
from dataclasses import dataclass

DEFAULT_SCOPE = "https://ai.azure.com/.default"

# Toda variável que o serviço lê ou que a plataforma injeta para ele. O deploycheck usa esta
# lista para achar variável digitada errada no Bicep (XR004).
KNOWN_ENV: frozenset[str] = frozenset(
    {
        "APP_ENV",
        "LLM_BACKEND",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_DEPLOYMENT",
        "AZURE_OPENAI_SCOPE",
        "AZURE_CLIENT_ID",
        "MAX_PROMPT_CHARS",
        "KEEPALIVE_SECONDS",
        "UPSTREAM_TIMEOUT_SECONDS",
        "APPLICATIONINSIGHTS_CONNECTION_STRING",
        "OTEL_SERVICE_NAME",
        "PARTNER_API_KEY",
    }
)

BACKENDS = ("fake", "azure")


class ConfigError(ValueError):
    """Configuração inválida; a mensagem lista todos os problemas de uma vez."""


@dataclass(frozen=True, slots=True)
class Settings:
    app_env: str
    llm_backend: str
    azure_endpoint: str
    azure_deployment: str
    azure_scope: str
    max_prompt_chars: int
    keepalive_s: float
    upstream_timeout_s: float
    connection_string: str


def _positive(env: Mapping[str, str], name: str, default: str, errors: list[str]) -> float:
    raw = env.get(name, default)
    try:
        value = float(raw)
    except ValueError:
        errors.append(f"{name}={raw!r} não é número")
        return 0.0
    if value <= 0:
        errors.append(f"{name} deve ser maior que zero (recebido {raw})")
    return value


def load_settings(env: Mapping[str, str]) -> Settings:
    errors: list[str] = []
    backend = env.get("LLM_BACKEND", "fake")
    if backend not in BACKENDS:
        errors.append(f"LLM_BACKEND={backend!r} inválido; use um de {BACKENDS}")
    endpoint = env.get("AZURE_OPENAI_ENDPOINT", "")
    deployment = env.get("AZURE_OPENAI_DEPLOYMENT", "")
    if backend == "azure":
        if not endpoint.startswith("https://"):
            errors.append(
                "AZURE_OPENAI_ENDPOINT deve começar com https:// quando LLM_BACKEND=azure"
            )
        if not deployment:
            errors.append("AZURE_OPENAI_DEPLOYMENT é obrigatório quando LLM_BACKEND=azure")
    max_chars = int(_positive(env, "MAX_PROMPT_CHARS", "8000", errors))
    keepalive = _positive(env, "KEEPALIVE_SECONDS", "15", errors)
    upstream = _positive(env, "UPSTREAM_TIMEOUT_SECONDS", "120", errors)
    if errors:
        raise ConfigError("; ".join(errors))
    return Settings(
        app_env=env.get("APP_ENV", "dev"),
        llm_backend=backend,
        azure_endpoint=endpoint,
        azure_deployment=deployment,
        azure_scope=env.get("AZURE_OPENAI_SCOPE", DEFAULT_SCOPE),
        max_prompt_chars=max_chars,
        keepalive_s=keepalive,
        upstream_timeout_s=upstream,
        connection_string=env.get("APPLICATIONINSIGHTS_CONNECTION_STRING", ""),
    )
