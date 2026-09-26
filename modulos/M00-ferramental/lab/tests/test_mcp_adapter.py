import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


@unittest.skipIf(importlib.util.find_spec("mcp") is None, "instale o extra mcp")
class McpAdapterTests(unittest.IsolatedAsyncioTestCase):
    async def test_tool_works_through_official_in_memory_client(self) -> None:
        from mcp import Client

        from harness_lab.mcp_adapter import mcp

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "PROGRESSO.md").write_text("M00 em revisão", encoding="utf-8")
            with patch.dict(os.environ, {"M00_PROGRESS_ROOT": directory}):
                async with Client(mcp) as client:
                    result = await client.call_tool("course_progress", {"path": "PROGRESSO.md"})
        self.assertFalse(result.is_error)
        self.assertIn("M00 em revisão", str(result.structured_content))

    async def test_tool_rejects_path_escape(self) -> None:
        from mcp import Client

        from harness_lab.mcp_adapter import mcp

        with (
            tempfile.TemporaryDirectory() as directory,
            patch.dict(os.environ, {"M00_PROGRESS_ROOT": directory}),
        ):
            async with Client(mcp) as client:
                result = await client.call_tool("course_progress", {"path": "../fora.md"})
        self.assertTrue(result.is_error)
        self.assertIn("fora de M00_PROGRESS_ROOT", str(result.content))
