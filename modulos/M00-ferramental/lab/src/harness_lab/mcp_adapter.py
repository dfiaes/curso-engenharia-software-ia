"""Adapter opcional para publicar a capability de progresso pelo MCP Python SDK v2."""

import os
from pathlib import Path

from mcp.server import MCPServer

from harness_lab.progress import course_progress as read_course_progress

mcp = MCPServer(
    "M00 Course Progress",
    instructions=(
        "Read a progress file under the configured root. Never write; return at most 2000 chars."
    ),
)


def _safe_progress_path(relative_path: str) -> Path:
    root = Path(os.environ.get("M00_PROGRESS_ROOT", ".")).resolve(strict=False)
    target = (root / relative_path).resolve(strict=False)
    if not target.is_relative_to(root):
        raise ValueError("path resolve fora de M00_PROGRESS_ROOT")
    return target


@mcp.tool()
def course_progress(path: str) -> dict[str, str | int | bool]:
    """Read one relative Markdown progress path under the configured root."""
    return read_course_progress(_safe_progress_path(path), max_chars=2_000)
