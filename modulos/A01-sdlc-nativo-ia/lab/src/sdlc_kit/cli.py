"""Command line: ``python -m sdlc_kit <validate|hook|agent-hook|detect|demo-series>``."""

from __future__ import annotations

import argparse
import csv
import sys
from collections.abc import Sequence
from pathlib import Path

from sdlc_kit import agent_hook
from sdlc_kit.anomaly import DetectionError, scan
from sdlc_kit.artifacts import validate_tree
from sdlc_kit.bands import BandsError, load_bands
from sdlc_kit.demo import synthetic_series, to_csv
from sdlc_kit.diagnosis import diagnosis_intent
from sdlc_kit.findings import Finding
from sdlc_kit.gitio import current_branch, run_checks
from sdlc_kit.policy import load_policy


def _report(findings: list[Finding]) -> int:
    for finding in findings:
        print(finding.render())
    print(f"{len(findings)} problema(s)" if findings else "ok")
    return 1 if findings else 0


def read_series(path: Path) -> list[float]:
    with path.open(encoding="utf-8", newline="") as handle:
        return [float(row["value"]) for row in csv.DictReader(handle)]


def _relative(path: str, root: Path) -> str:
    candidate = Path(path)
    if candidate.is_absolute():
        try:
            return candidate.relative_to(root.resolve()).as_posix()
        except ValueError:
            return candidate.as_posix()
    return candidate.as_posix()


def _cmd_validate(args: argparse.Namespace) -> int:
    return _report(validate_tree(Path(args.root)))


def _cmd_hook(args: argparse.Namespace) -> int:
    repo = Path(args.repo)
    policy = load_policy(Path(args.policy))
    return _report(run_checks(repo, policy, args.mode, args.base, args.branch))


def _cmd_agent_hook(args: argparse.Namespace) -> int:
    root = Path(args.root)
    policy = load_policy(Path(args.policy))
    payload = agent_hook.parse_payload(sys.stdin.read())
    branch = args.branch if args.branch else current_branch(root)
    relative = {_relative(p, root): p for p in agent_hook.extract_paths(payload)}
    for rel in relative:
        decision = agent_hook.decide(
            {"file_path": rel}, policy, branch, lambda p: (root / p).exists()
        )
        if decision.blocked:
            print(decision.reason, file=sys.stderr)
            return agent_hook.EXIT_BLOCK
    return 0


def _cmd_detect(args: argparse.Namespace) -> int:
    bands = load_bands(Path(args.bands))
    series = read_series(Path(args.csv))
    breaches = scan(series, bands.window, bands.lookback, bands.min_std, bands.rules)
    if not breaches:
        print("sem violações")
        return 0
    worst: tuple[int, str] | None = None
    for breach in breaches:
        tier = bands.tier_for(breach)
        label = tier.name if tier else "-"
        print(f"{breach.rule} idx={breach.index} {breach.direction} z={breach.z:.2f} tier={label}")
        if tier and tier.action != "log" and (worst is None or tier.sigma > worst[0]):
            worst = (tier.sigma, breach.rule)
    if worst is None:
        print("apenas registro: nenhum intent gerado")
        return 0
    chosen = next(b for b in breaches if b.rule == worst[1])
    tier = bands.tier_for(chosen)
    assert tier is not None
    text = diagnosis_intent(args.intent_id, bands, chosen, tier, series[-8:], args.when)
    assert text is not None
    out = Path(args.out) / f"{args.intent_id}-{bands.metric}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(f"intent de diagnóstico: {out.as_posix()}")
    return 1


def _cmd_demo(args: argparse.Namespace) -> int:
    sys.stdout.write(to_csv(synthetic_series(args.kind, args.seed)))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sdlc_kit")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("validate", help="validate docs/intent, docs/specs, docs/plans")
    p.add_argument("--root", default=".")
    p.set_defaults(func=_cmd_validate)

    p = sub.add_parser("hook", help="pre-commit / CI checks")
    p.add_argument("--mode", choices=("staged", "range", "commits"), required=True)
    p.add_argument("--policy", required=True)
    p.add_argument("--base", default="origin/main")
    p.add_argument("--branch", default=None)
    p.add_argument("--repo", default=".")
    p.set_defaults(func=_cmd_hook)

    p = sub.add_parser("agent-hook", help="agent PreToolUse shim (JSON on stdin; exit 2 blocks)")
    p.add_argument("--policy", required=True)
    p.add_argument("--branch", default="")
    p.add_argument("--root", default=".")
    p.set_defaults(func=_cmd_agent_hook)

    p = sub.add_parser("detect", help="Western Electric detection + diagnosis intent")
    p.add_argument("--bands", required=True)
    p.add_argument("--csv", required=True)
    p.add_argument("--out", default="docs/intent")
    p.add_argument("--intent-id", default="INT-900")
    p.add_argument("--when", default="1970-01-01T00:00:00Z")
    p.set_defaults(func=_cmd_detect)

    p = sub.add_parser("demo-series", help="print a synthetic metric CSV")
    p.add_argument("kind", choices=("flat", "spike", "drift", "step"))
    p.add_argument("--seed", type=int, default=7)
    p.set_defaults(func=_cmd_demo)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        code: int = args.func(args)
    except (BandsError, DetectionError, ValueError, RuntimeError, OSError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 64
    return code


if __name__ == "__main__":
    raise SystemExit(main())
