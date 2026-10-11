import pytest

from llm_service.config import KNOWN_ENV, ConfigError, load_settings
from llm_service.cost import (
    ComputePrice,
    TokenPrice,
    call_cost,
    monthly_llm_cost,
    replica_cost,
)
from llm_service.telemetry import setup_telemetry


def test_defaults_are_safe_and_fake() -> None:
    s = load_settings({})
    assert s.llm_backend == "fake"
    assert s.max_prompt_chars == 8000
    assert s.connection_string == ""


def test_azure_requires_https_endpoint_and_deployment() -> None:
    with pytest.raises(ConfigError) as err:
        load_settings({"LLM_BACKEND": "azure", "AZURE_OPENAI_ENDPOINT": "http://x"})
    message = str(err.value)
    assert "https://" in message and "AZURE_OPENAI_DEPLOYMENT" in message


def test_all_problems_reported_at_once() -> None:
    with pytest.raises(ConfigError) as err:
        load_settings({"LLM_BACKEND": "gcp", "MAX_PROMPT_CHARS": "abc", "KEEPALIVE_SECONDS": "-1"})
    message = str(err.value)
    assert "LLM_BACKEND" in message and "MAX_PROMPT_CHARS" in message and "KEEPALIVE" in message


def test_azure_settings_roundtrip() -> None:
    s = load_settings(
        {
            "LLM_BACKEND": "azure",
            "AZURE_OPENAI_ENDPOINT": "https://a.openai.azure.com/",
            "AZURE_OPENAI_DEPLOYMENT": "gpt-x",
        }
    )
    assert s.azure_deployment == "gpt-x"
    assert s.azure_scope.endswith("/.default")


def test_known_env_contains_every_setting_name() -> None:
    assert {"LLM_BACKEND", "AZURE_CLIENT_ID", "PARTNER_API_KEY"} <= KNOWN_ENV


def test_call_cost_and_monthly() -> None:
    price = TokenPrice(input_per_million=1.0, output_per_million=4.0)
    assert call_cost(1_000_000, 0, price) == pytest.approx(1.0)
    assert call_cost(500, 250, price) == pytest.approx(0.0015)
    assert monthly_llm_cost(1000, 500, 250, price) == pytest.approx(45.0)


def test_cost_rejects_negative_inputs() -> None:
    with pytest.raises(ValueError):
        monthly_llm_cost(-1, 1, 1, TokenPrice(1, 1))
    with pytest.raises(ValueError):
        replica_cost(-1, 1, 1, 1, ComputePrice(1, 1, 1, 1))


def test_replica_cost_splits_active_and_idle() -> None:
    price = ComputePrice(active_vcpu_s=2.0, active_gib_s=1.0, idle_vcpu_s=0.5, idle_gib_s=0.25)
    # 0.5 vCPU, 1 GiB: ativo 10 s, ocioso 100 s
    assert replica_cost(0.5, 1.0, 10, 100, price) == pytest.approx(10 * 2.0 + 100 * 0.5)


def test_telemetry_off_without_connection_string_and_never_imports() -> None:
    calls: list[str] = []

    def loader(name: str) -> object:
        calls.append(name)
        raise AssertionError("não deveria importar")

    assert setup_telemetry(load_settings({}), loader) is False
    assert calls == []


def test_telemetry_on_calls_distro_with_connection_string() -> None:
    seen: dict[str, object] = {}

    class Distro:
        @staticmethod
        def configure_azure_monitor(**kwargs: object) -> None:
            seen.update(kwargs)

    settings = load_settings({"APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=x"})
    assert setup_telemetry(settings, lambda _name: Distro) is True
    assert seen["connection_string"] == "InstrumentationKey=x"


def test_telemetry_missing_extra_is_actionable() -> None:
    def loader(name: str) -> object:
        raise ModuleNotFoundError(name)

    settings = load_settings({"APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=x"})
    with pytest.raises(ConfigError, match="extra 'azure'"):
        setup_telemetry(settings, loader)
