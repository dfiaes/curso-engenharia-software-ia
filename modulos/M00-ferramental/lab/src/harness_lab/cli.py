"""CLI de evidência do laboratório M00."""

from __future__ import annotations

import argparse
from pathlib import Path

from harness_lab.context import ContextItem, select_context
from harness_lab.contract import load_contract
from harness_lab.policy import Capability, TaskRequest, evaluate


def _validate(path: Path) -> int:
    contract = load_contract(path)
    violations = contract.violations()
    if violations:
        for violation in violations:
            print(violation)
        return 1
    print(f"VALID {path.as_posix()}")
    return 0


def _context_demo() -> int:
    selection = select_context(
        [
            ContextItem("AGENTS.md", 180, 1.0, 1.0, required=True),
            ContextItem("arquivo-alvo.py", 420, 1.0, 0.95),
            ContextItem("teste-alvo.py", 350, 0.9, 0.95),
            ContextItem("historico-completo.txt", 2_500, 0.2, 0.6),
        ],
        budget=1_000,
    )
    print(f"CONTEXT {selection.used_tokens}/{selection.budget}")
    print("INCLUDED", ", ".join(item.name for item in selection.included))
    print("OMITTED", ", ".join(item.name for item in selection.omitted))
    return 0


def _policy_demo(workspace: Path) -> int:
    allowlist = (("python", "-m", "unittest"), ("ruff", "check"))
    requests = [
        TaskRequest(frozenset({Capability.READ}), True, workspace / "README.md"),
        TaskRequest(frozenset({Capability.READ, Capability.NETWORK}), False),
        TaskRequest(frozenset({Capability.READ}), True, workspace / ".." / "fora.txt"),
    ]
    for request in requests:
        print(evaluate(request, workspace=workspace, allowed_command_prefixes=allowlist).code)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Evidências determinísticas do M00")
    subparsers = parser.add_subparsers(dest="command", required=True)
    validate = subparsers.add_parser("validate", help="valida contrato JSON")
    validate.add_argument("path", type=Path)
    subparsers.add_parser("context-demo", help="demonstra seleção sob orçamento")
    policy = subparsers.add_parser("policy-demo", help="demonstra decisões de policy")
    policy.add_argument("--workspace", type=Path, required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.command == "validate":
        return _validate(args.path)
    if args.command == "context-demo":
        return _context_demo()
    if args.command == "policy-demo":
        return _policy_demo(args.workspace)
    raise AssertionError("subcomando não tratado")
