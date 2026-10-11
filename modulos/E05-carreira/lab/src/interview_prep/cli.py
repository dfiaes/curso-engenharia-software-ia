"""Command line: validate-bank, practice, status, checklist."""

from __future__ import annotations

import argparse
import sys
from collections.abc import Callable
from datetime import date
from pathlib import Path
from typing import TextIO

from interview_prep.checklist import check_readme
from interview_prep.leitner import (
    MAX_BOX,
    Clock,
    Deck,
    StateError,
    load_state,
    save_state,
)
from interview_prep.models import BankError, QuestionBank, coverage_problems, load_bank

EXIT_OK = 0
EXIT_NEGATIVE = 1
EXIT_ERROR = 2

InputFn = Callable[[str], str]


def run_practice(
    bank: QuestionBank,
    deck: Deck,
    save: Callable[[], None],
    *,
    input_fn: InputFn,
    out: TextIO,
    limit: int,
    topic: str | None = None,
) -> int:
    """Ask due questions one at a time; state is saved after every answer."""
    questions = bank.by_id()
    queue = [qid for qid in deck.due_ids() if topic is None or questions[qid].topic.value == topic][
        :limit
    ]
    if not queue:
        print("Nada para revisar hoje.", file=out)
        return EXIT_OK
    answered = 0
    for qid in queue:
        question = questions[qid]
        card = deck.state.cards[qid]
        print(f"\n[caixa {card.box}] {question.topic.value} · {question.module}", file=out)
        print(question.question, file=out)
        try:
            if input_fn("Enter para ver a resposta-modelo (q sai) > ").strip().lower() == "q":
                break
            print(f"\nResposta-modelo: {question.model_answer}", file=out)
            for criterion in question.criteria:
                print(f"  - {criterion}", file=out)
            verdict = ""
            while verdict not in {"s", "n", "q"}:
                verdict = input_fn("Acertou? [s/n/q] > ").strip().lower()
        except EOFError:
            break
        if verdict == "q":
            break
        updated = deck.review(qid, correct=verdict == "s")
        save()
        answered += 1
        print(f"-> caixa {updated.box}, próxima revisão em {updated.due.isoformat()}", file=out)
    print(f"\n{answered} pergunta(s) respondida(s).", file=out)
    return EXIT_OK


def _status(deck: Deck, out: TextIO) -> int:
    counts = deck.box_counts()
    for box in range(1, MAX_BOX + 1):
        print(f"caixa {box}: {counts[box]}", file=out)
    print(f"vencidas hoje: {len(deck.due_ids())}", file=out)
    return EXIT_OK


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="interview_prep")
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate-bank", help="validate the question bank")
    validate.add_argument("--bank", type=Path, default=None)

    for name in ("practice", "status"):
        cmd = sub.add_parser(name)
        cmd.add_argument("--state", type=Path, required=True)
        cmd.add_argument("--today", type=date.fromisoformat, default=None)
        cmd.add_argument("--bank", type=Path, default=None)
        if name == "practice":
            cmd.add_argument("--limit", type=int, default=5)
            cmd.add_argument("--topic", default=None)

    check = sub.add_parser("checklist", help="check a project README for portfolio sections")
    check.add_argument("readme", type=Path)
    return parser


def main(
    argv: list[str] | None = None,
    *,
    clock: Clock = date.today,
    input_fn: InputFn = input,
    out: TextIO | None = None,
    err: TextIO | None = None,
) -> int:
    out = out or sys.stdout
    err = err or sys.stderr
    try:
        args = _build_parser().parse_args(argv)
    except SystemExit as exc:  # argparse exits with 2 on usage errors, 0 on --help
        return int(exc.code) if isinstance(exc.code, int) else EXIT_ERROR
    try:
        return _dispatch(args, clock, input_fn, out)
    except (BankError, StateError, OSError) as exc:
        print(f"erro: {exc}", file=err)
        return EXIT_ERROR


def _dispatch(args: argparse.Namespace, clock: Clock, input_fn: InputFn, out: TextIO) -> int:
    if args.command == "checklist":
        report = check_readme(args.readme.read_text(encoding="utf-8"))
        print(report.render(), file=out)
        return EXIT_OK if report.passed else EXIT_NEGATIVE

    bank = load_bank(args.bank)
    if args.command == "validate-bank":
        problems = coverage_problems(bank)
        topics = {q.topic for q in bank.questions}
        print(f"{len(bank.questions)} perguntas, {len(topics)} temas", file=out)
        for problem in problems:
            print(f"problema: {problem}", file=out)
        return EXIT_NEGATIVE if problems else EXIT_OK

    today: date = args.today if args.today is not None else clock()
    deck = Deck(load_state(args.state), lambda: today)
    deck.sync(q.id for q in bank.questions)
    if args.command == "status":
        return _status(deck, out)
    return run_practice(
        bank,
        deck,
        lambda: save_state(args.state, deck.state),
        input_fn=input_fn,
        out=out,
        limit=args.limit,
        topic=args.topic,
    )


if __name__ == "__main__":
    raise SystemExit(main())
