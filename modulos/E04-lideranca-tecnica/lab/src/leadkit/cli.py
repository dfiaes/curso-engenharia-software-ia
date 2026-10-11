"""Command line: ``leadkit estimate | dora | check``.

Exit codes follow the convention from F01: 0 ok, 1 findings (``check`` only), 2 bad input.
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

from leadkit import doccheck, dora, estimate
from leadkit.errors import InputError


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="leadkit", description="Ferramentas para tech leads")
    sub = parser.add_subparsers(dest="command", required=True)

    est = sub.add_parser("estimate", help="previsão de prazo por Monte Carlo")
    est.add_argument("tasks", type=Path, help="CSV name,low,likely,high")
    est.add_argument("--risks", type=Path, help="CSV name,probability,impact")
    est.add_argument("--runs", type=int, default=10_000)
    est.add_argument("--seed", type=int, default=42)
    est.add_argument(
        "--dist",
        type=estimate.Distribution,
        choices=list(estimate.Distribution),
        default=estimate.Distribution.PERT,
    )
    est.add_argument(
        "--capacity",
        type=float,
        default=1.0,
        help="dias-pessoa entregues por dia corrido (ex.: 3 pessoas x 0,6 foco = 1,8)",
    )

    met = sub.add_parser("dora", help="quatro métricas DORA a partir de CSV")
    met.add_argument("deploys", type=Path)
    met.add_argument("incidents", type=Path)
    met.add_argument("--days", type=float, help="janela em dias (padrão: do 1º ao último deploy)")

    chk = sub.add_parser("check", help="valida a estrutura de um documento")
    chk.add_argument("kind", choices=sorted(doccheck.SPECS))
    chk.add_argument("file", type=Path)
    return parser


def _run_estimate(args: argparse.Namespace) -> int:
    if args.capacity <= 0:
        raise InputError("--capacity precisa ser positivo")
    tasks = estimate.read_tasks(args.tasks)
    risks = estimate.read_risks(args.risks) if args.risks else []
    result = estimate.forecast(tasks, risks, runs=args.runs, seed=args.seed, dist=args.dist)
    cap = args.capacity
    print(
        f"tarefas: {len(tasks)}  riscos: {len(risks)}  execuções: {result.runs}  "
        f"semente: {result.seed}  distribuição: {result.distribution.value}"
    )
    print(f"soma dos 'provável' (estimativa de ponto): {result.naive_sum:.1f} dias-pessoa")
    print(f"esforço   média {result.mean:.1f}  mín {result.minimum:.1f}  máx {result.maximum:.1f}")
    for label, value in (("P50", result.p50), ("P85", result.p85), ("P95", result.p95)):
        print(f"{label}: {value:6.1f} dias-pessoa  ->  {value / cap:6.1f} dias corridos")
    gap = (result.naive_sum / result.p50 - 1) * 100
    print(f"a soma dos 'provável' fica {gap:+.0f}% em relação ao P50")
    return 0


def _run_dora(args: argparse.Namespace) -> int:
    report = dora.compute(
        dora.read_deploys(args.deploys),
        dora.read_incidents(args.incidents),
        window_days=args.days,
    )
    print(f"janela: {report.window_days:.1f} dias  deploys: {report.deploys}")
    print(f"frequência de deploy:        {report.deploys_per_week:.1f} por semana")
    print(
        f"lead time (commit->deploy):  mediana {report.lead_time_median_h:.1f} h"
        f"  P85 {report.lead_time_p85_h:.1f} h"
    )
    print(
        f"taxa de falha de mudança:    {report.change_failure_rate * 100:.1f}% "
        f"({report.failed_deploys}/{report.deploys} deploys)"
    )
    if report.recovery_median_h is None:
        print("tempo de recuperação:        sem incidentes resolvidos")
    else:
        print(f"tempo de recuperação:        mediana {report.recovery_median_h:.1f} h")
    if report.open_incidents:
        print(
            f"atenção: {report.open_incidents} incidente(s) em aberto fora do tempo de recuperação"
        )
    return 0


def _run_check(args: argparse.Namespace) -> int:
    try:
        text = args.file.read_text(encoding="utf-8")
    except OSError as exc:
        raise InputError(f"{args.file}: {exc.strerror}") from exc
    findings = doccheck.check(args.kind, text)
    for f in findings:
        print(f"{args.file.name}:{f.line}: [{f.code}] {f.message}")
    if findings:
        print(f"{len(findings)} problema(s)")
        return 1
    print(f"{args.file.name}: ok ({args.kind})")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    try:
        if args.command == "estimate":
            return _run_estimate(args)
        if args.command == "dora":
            return _run_dora(args)
        return _run_check(args)
    except InputError as exc:
        print(f"leadkit: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
