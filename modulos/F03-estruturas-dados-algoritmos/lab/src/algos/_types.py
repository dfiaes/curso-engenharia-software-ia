"""Shared typing helpers."""

from typing import Any, Protocol


class SupportsLessThan(Protocol):
    """Anything that can be ordered with ``<`` (the only comparison the course code uses)."""

    def __lt__(self, other: Any, /) -> bool: ...
