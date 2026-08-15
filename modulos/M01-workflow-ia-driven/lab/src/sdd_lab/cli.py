"""CLI pequena: valida contrato, executa gates e persiste evidência."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path

from sdd_lab.adapters import AgentSkillsAdapter, GenericHarnessAdapter
from sdd_lab.contract import load_contract
from sdd_lab.runner import CommandPolicy, RunSpec, run_command


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sdd-lab")
    subparsers = parser.add_subparsers(dest="command", required=True)
    validate = subparsers.add_parser("validate", help="valida contrato sem executar comandos")
    validate.add_argument("contract", type=Path)
    check = subparsers.add_parser("check", help="valida e executa gates tokenizados")
    check.add_argument("contract", type=Path)
    check.add_argument("--evidence", type=Path, default=Path("evidence/run.json"))
    adapters = subparsers.add_parser("adapters-demo", help="prova o fingerprint comum")
    adapters.add_argument("contract", type=Path)
    return parser


def _print_issues(path: Path) -> int:
    result = load_contract(path)
    if result.ok and result.contract is not None:
        print(f"VALID {result.contract.feature_id}")
        return 0
    for issue in result.issues:
        print(f"{issue.code}: {issue.location}: {issue.message}", file=sys.stderr)
    return 20


def _check(path: Path, evidence_path: Path) -> int:
    result = load_contract(path)
    if not result.ok or result.contract is None:
        return _print_issues(path)
    workspace = path.parent.resolve()
    policy = CommandPolicy(
        allowed_executables=frozenset(
            {"python", "python.exe", "uv", "uv.exe", "ruff", "ruff.exe", "mypy", "mypy.exe"}
        ),
        workspace=workspace,
    )
    evidence = []
    for argv in result.contract.gates:
        run = run_command(RunSpec(argv, cwd=workspace), policy)
        evidence.append(asdict(run))
        if run.exit_code != 0:
            break
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    evidence_path.write_text(
        json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return 0 if evidence and all(item["exit_code"] == 0 for item in evidence) else 30


def _adapters(path: Path) -> int:
    result = load_contract(path)
    if not result.ok or result.contract is None:
        return _print_issues(path)
    envelopes = [
        AgentSkillsAdapter().render(result.contract),
        GenericHarnessAdapter().render(result.contract),
    ]
    for envelope in envelopes:
        print(f"{envelope.adapter}: {envelope.contract_fingerprint}")
    return 0 if len({item.contract_fingerprint for item in envelopes}) == 1 else 30


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    if args.command == "validate":
        return _print_issues(args.contract)
    if args.command == "check":
        return _check(args.contract, args.evidence)
    if args.command == "adapters-demo":
        return _adapters(args.contract)
    return 64
