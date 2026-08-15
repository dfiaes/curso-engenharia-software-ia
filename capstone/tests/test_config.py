from decimal import Decimal

import pytest
from pydantic import ValidationError

from cartografo.config import Settings


def valid_settings() -> dict[str, object]:
    return {
        "environment": "test",
        "database_url": "postgresql://user:password@localhost/cartografo",
        "model_adapter": "fake",
        "max_repository_bytes": 1024,
        "max_analysis_cost": Decimal("1.00"),
    }


def test_settings_are_typed_and_secret_is_not_exposed() -> None:
    settings = Settings.model_validate(valid_settings())

    assert settings.environment == "test"
    assert settings.max_analysis_cost == Decimal("1.00")
    assert "password" not in repr(settings.database_url)


def test_settings_reject_unknown_or_unsafe_values() -> None:
    values = valid_settings()
    values["unexpected"] = "not allowed"

    with pytest.raises(ValidationError):
        Settings.model_validate(values)


def test_settings_require_postgresql_boundary() -> None:
    values = valid_settings()
    values["database_url"] = "sqlite:///local.db"

    with pytest.raises(ValidationError, match="must use PostgreSQL"):
        Settings.model_validate(values)
