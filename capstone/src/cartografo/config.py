"""Typed configuration boundary for the Capstone."""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CARTOGRAFO_",
        env_file=".env",
        extra="forbid",
        frozen=True,
    )

    environment: Literal["local", "test", "staging", "production"] = "local"
    database_url: SecretStr
    model_adapter: Literal["fake", "cloud", "local"] = "fake"
    max_repository_bytes: int = Field(gt=0, le=1_073_741_824)
    max_analysis_cost: Decimal = Field(gt=0)
    evidence_directory: Path = Path("evidence")

    @field_validator("database_url")
    @classmethod
    def require_postgresql(cls, value: SecretStr) -> SecretStr:
        raw = value.get_secret_value()
        if not raw.startswith(("postgresql://", "postgresql+asyncpg://")):
            raise ValueError("database_url must use PostgreSQL")
        return value
