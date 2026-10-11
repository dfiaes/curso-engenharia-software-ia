"""A small grep: reads files or stdin, writes matches to stdout, errors to stderr.

Exit codes follow grep: 0 = at least one line selected, 1 = no line selected,
2 = error (bad regex, unreadable file). Signals: SIGINT -> 130, closed pipe -> 141.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from collections.abc import Iterable, Iterator
from pathlib import Path

EXIT_MATCH = 0
EXIT_NO_MATCH = 1
EXIT_ERROR = 2
EXIT_SIGINT = 130  # 128 + SIGINT(2)
EXIT_SIGPIPE = 141  # 128 + SIGPIPE(13)


def select_lines(
    lines: Iterable[bytes], pattern: re.Pattern[str], *, invert: bool = False
) -> Iterator[tuple[int, str]]:
    """Yield (line number, text without the trailing newline) for selected lines.

    Only ``\\n`` is removed: a ``\\r`` from a CRLF file stays in the text, so ``$``
    does not match right after the visible last character of such a line.
    """
    for number, raw in enumerate(lines, start=1):
        text = raw.decode("utf-8", errors="replace").removesuffix("\n")
        if bool(pattern.search(text)) != invert:
            yield number, text


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="pgrep", description="grep minimalista")
    parser.add_argument("pattern", help="expressão regular (sintaxe re do Python)")
    parser.add_argument("files", nargs="*", help="arquivos; sem eles, lê a entrada padrão")
    parser.add_argument("-i", "--ignore-case", action="store_true")
    parser.add_argument("-v", "--invert-match", action="store_true")
    parser.add_argument("-n", "--line-number", action="store_true")
    parser.add_argument("-c", "--count", action="store_true")
    parser.add_argument(
        "--line-buffered", action="store_true", help="descarrega a saída a cada linha"
    )
    return parser


def _is_binary(path: Path) -> bool:
    with path.open("rb") as handle:
        return b"\0" in handle.read(8192)


def _run(args: argparse.Namespace) -> int:
    try:
        pattern = re.compile(args.pattern, re.IGNORECASE if args.ignore_case else 0)
    except re.error as exc:
        print(f"pgrep: expressão inválida: {exc}", file=sys.stderr)
        return EXIT_ERROR

    sources: list[tuple[str | None, Iterable[bytes]]] = []
    status = EXIT_NO_MATCH
    failed = False
    if args.files:
        label = len(args.files) > 1
        for name in args.files:
            path = Path(name)
            try:
                if _is_binary(path):
                    print(f"pgrep: {name}: arquivo binário ignorado", file=sys.stderr)
                    continue
                data = path.read_bytes().splitlines(keepends=True)
            except OSError as exc:
                print(f"pgrep: {name}: {exc.strerror}", file=sys.stderr)
                failed = True
                continue
            sources.append((name if label else None, data))
    else:
        sources.append((None, sys.stdin.buffer))

    for label_name, lines in sources:
        total = 0
        for number, text in select_lines(lines, pattern, invert=args.invert_match):
            total += 1
            status = EXIT_MATCH
            if args.count:
                continue
            prefix = f"{label_name}:" if label_name else ""
            if args.line_number:
                prefix += f"{number}:"
            sys.stdout.write(f"{prefix}{text}\n")
            if args.line_buffered:
                sys.stdout.flush()
        if args.count:
            sys.stdout.write(f"{label_name + ':' if label_name else ''}{total}\n")
    sys.stdout.flush()
    return EXIT_ERROR if failed else status


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    try:
        return _run(args)
    except KeyboardInterrupt:
        return EXIT_SIGINT
    except BrokenPipeError:
        # O leitor do pipe (por exemplo `head`) fechou. Redireciona stdout para
        # /dev/null para o flush final do interpretador não gerar outro erro.
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
        return EXIT_SIGPIPE


if __name__ == "__main__":
    raise SystemExit(main())
