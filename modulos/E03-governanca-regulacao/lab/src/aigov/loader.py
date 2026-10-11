"""Load a register from YAML or JSON. Every failure becomes a LoadError with a readable text."""

import json
from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError

from aigov.models import AISystemRecord


class LoadError(Exception):
    """The file could not be read, parsed or does not match the schema."""


def _parse(path: Path) -> Any:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise LoadError(f"{path}: {exc.strerror or exc}") from exc
    try:
        if path.suffix.lower() == ".json":
            return json.loads(text)
        if path.suffix.lower() in {".yaml", ".yml"}:
            return yaml.safe_load(text)
    except (json.JSONDecodeError, yaml.YAMLError) as exc:
        raise LoadError(f"{path}: invalid syntax: {exc}") from exc
    raise LoadError(f"{path}: unsupported extension (use .yaml, .yml or .json)")


def load_record(path: Path) -> AISystemRecord:
    data = _parse(path)
    if not isinstance(data, dict):
        raise LoadError(f"{path}: top level must be a mapping")
    try:
        return AISystemRecord.model_validate(data)
    except ValidationError as exc:
        lines = [f"{path}: schema errors"]
        for err in exc.errors():
            where = ".".join(str(p) for p in err["loc"]) or "<root>"
            lines.append(f"  {where}: {err['msg']}")
        raise LoadError("\n".join(lines)) from exc
