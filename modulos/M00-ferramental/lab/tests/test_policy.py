import tempfile
import unittest
from pathlib import Path

from harness_lab.policy import Capability, TaskRequest, evaluate


class PolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.workspace = Path(self.temporary.name)
        self.allowlist = (("python", "-m", "unittest"), ("ruff", "check"))

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def decide(self, request: TaskRequest) -> str:
        return evaluate(
            request,
            workspace=self.workspace,
            allowed_command_prefixes=self.allowlist,
        ).code

    def test_read_inside_workspace_is_allowed(self) -> None:
        request = TaskRequest(frozenset({Capability.READ}), True, self.workspace / "src" / "app.py")
        self.assertEqual("ALLOW_READ", self.decide(request))

    def test_path_escape_is_denied(self) -> None:
        request = TaskRequest(frozenset({Capability.READ}), True, self.workspace / ".." / "x")
        self.assertEqual("DENY_PATH_ESCAPE", self.decide(request))

    def test_untrusted_write_is_denied(self) -> None:
        request = TaskRequest(frozenset({Capability.READ, Capability.WRITE}), False)
        self.assertEqual("DENY_UNTRUSTED_CAPABILITY", self.decide(request))

    def test_untrusted_network_is_denied(self) -> None:
        request = TaskRequest(frozenset({Capability.READ, Capability.NETWORK}), False)
        self.assertEqual("DENY_UNTRUSTED_CAPABILITY", self.decide(request))

    def test_command_requires_process_capability(self) -> None:
        request = TaskRequest(
            frozenset({Capability.READ}), True, command=("python", "-m", "unittest")
        )
        self.assertEqual("DENY_PROCESS_CAPABILITY", self.decide(request))

    def test_unknown_command_is_denied(self) -> None:
        request = TaskRequest(
            frozenset({Capability.PROCESS}), True, command=("powershell", "danger.ps1")
        )
        self.assertEqual("DENY_COMMAND", self.decide(request))

    def test_allowlisted_command_is_allowed(self) -> None:
        request = TaskRequest(
            frozenset({Capability.PROCESS}),
            True,
            command=("python", "-m", "unittest", "discover"),
        )
        self.assertEqual("ALLOW", self.decide(request))


if __name__ == "__main__":
    unittest.main()
