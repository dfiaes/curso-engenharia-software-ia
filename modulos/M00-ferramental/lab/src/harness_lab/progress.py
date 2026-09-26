"""Capability de domínio testável sem MCP e sem modelo."""

from pathlib import Path


def course_progress(path: Path, *, max_chars: int = 2_000) -> dict[str, str | int | bool]:
    if max_chars <= 0:
        raise ValueError("max_chars deve ser positivo")
    text = path.read_text(encoding="utf-8")
    clipped = len(text) > max_chars
    return {
        "path": path.name,
        "content": text[:max_chars],
        "truncated": clipped,
        "original_chars": len(text),
    }
