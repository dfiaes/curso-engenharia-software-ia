"""Introspecção segura de annotations diferidas no Python 3.14."""

from __future__ import annotations

import annotationlib
from collections.abc import Callable
from typing import Any


def describe_annotations(callable_object: Callable[..., Any]) -> dict[str, str]:
    """Obtém representação textual sem executar nomes ainda indisponíveis."""

    annotations = annotationlib.get_annotations(callable_object, format=annotationlib.Format.STRING)
    return {name: str(value) for name, value in annotations.items()}
