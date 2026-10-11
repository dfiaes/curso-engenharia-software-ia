"""Liga a exportação para o Application Insights só quando há connection string."""

import importlib
from collections.abc import Callable
from typing import Any

from llm_service.config import ConfigError, Settings


def setup_telemetry(
    settings: Settings, loader: Callable[[str], Any] = importlib.import_module
) -> bool:
    """Devolve True se ligou a exportação. Sem connection string, não importa nada."""
    if not settings.connection_string:
        return False
    try:
        distro = loader("azure.monitor.opentelemetry")
    except ModuleNotFoundError as exc:
        raise ConfigError(
            "APPLICATIONINSIGHTS_CONNECTION_STRING definida, mas o extra 'azure' não está instalado"
        ) from exc
    distro.configure_azure_monitor(
        connection_string=settings.connection_string, logger_name="llm_service"
    )
    return True
