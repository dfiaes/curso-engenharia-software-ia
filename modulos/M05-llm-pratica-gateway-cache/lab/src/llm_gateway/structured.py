"""Saída estruturada: schema como contrato (lote M05).

O modelo devolve texto; este módulo impõe forma: parse JSON + validação
Pydantic. Forma não é verdade — schema aprovado não significa resposta
correta — mas sem forma não há programa que consuma a saída sem regex.
"""

from __future__ import annotations

import json

from pydantic import BaseModel, TypeAdapter, ValidationError


class StructuredError(ValueError):
    """A saída não é JSON válido ou não satisfaz o schema."""


class Abstention(BaseModel):
    """Abstenção como saída válida: 'não encontrei' tipado."""

    model_config = {"frozen": True}

    abstained: bool = True
    reason: str = ""


def parse_output[T: BaseModel](text: str, model: type[T]) -> T:
    """Parseia JSON e valida contra o schema. Erro vira `StructuredError`."""
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise StructuredError(f"saída não é JSON válido: {exc}") from exc
    try:
        return TypeAdapter(model).validate_python(payload)
    except ValidationError as exc:
        raise StructuredError(f"saída fora do schema {model.__name__}: {exc.errors()}") from exc


def require_complete_finish(finish_reason: str, text: str) -> str:
    """Truncamento é erro explícito: JSON cortado nunca é parseado."""
    if finish_reason == "max_tokens":
        raise StructuredError(f"resposta truncada pelo teto (texto parcial): {text[:60]!r}")
    return text
