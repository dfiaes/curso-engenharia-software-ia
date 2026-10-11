"""``python -m capacity [1|2|3]`` prints the estimates quoted in module E01."""

from __future__ import annotations

import argparse
import sys

from capacity.cases import ALL_CASES


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="capacity", description="Print the E01 case estimates")
    parser.add_argument(
        "case", nargs="?", type=int, choices=[1, 2, 3], help="one case; default all"
    )
    args = parser.parse_args(argv)
    selected = ALL_CASES if args.case is None else (ALL_CASES[args.case - 1],)
    print("\n\n".join(case().render() for case in selected))
    return 0


if __name__ == "__main__":
    sys.exit(main())
