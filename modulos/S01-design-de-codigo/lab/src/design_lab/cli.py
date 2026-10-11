"""Command line: ``complexidade``, ``golden`` and ``diferencial``."""

import argparse
import sys
from pathlib import Path

from design_lab import golden
from design_lab.complexidade import medir_fonte

GOLDEN_PADRAO = Path("tests/golden/saidas.json")


def _complexidade(arquivos: list[str]) -> int:
    print(f"{'arquivo:funcao':<52} {'linhas':>6} {'ciclo':>5} {'aninh':>5}")
    for arquivo in arquivos:
        for m in medir_fonte(Path(arquivo).read_text(encoding="utf-8")):
            print(
                f"{arquivo + ':' + m.nome:<52} {m.linhas:>6} {m.ciclomatica:>5} {m.aninhamento:>5}"
            )
    return 0


def _golden(escrever: bool, caminho: Path) -> int:
    if escrever:
        golden.escrever(caminho)
        print(f"{len(golden.CASOS)} casos congelados em {caminho}")
        return 0
    esperado = golden.carregar(caminho)
    atual = golden.observar()
    quebrados = sorted(nome for nome in atual if atual[nome] != esperado.get(nome))
    for nome in quebrados:
        print(f"diverge: {nome}", file=sys.stderr)
    print(f"{len(atual) - len(quebrados)}/{len(atual)} casos iguais ao golden")
    return 1 if quebrados else 0


def _diferencial(n: int, seed: int) -> int:
    achadas = golden.divergencias(n, seed)
    for caso, esperado, obtido in achadas[:3]:
        print(f"{caso.nome}: legado={esperado} refatorado={obtido}", file=sys.stderr)
    print(f"{n} casos aleatórios (seed {seed}), {len(achadas)} divergências")
    return 1 if achadas else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="design_lab.cli")
    sub = parser.add_subparsers(dest="comando", required=True)
    p_comp = sub.add_parser("complexidade", help="measure cyclomatic complexity per function")
    p_comp.add_argument("arquivos", nargs="+")
    p_gold = sub.add_parser("golden", help="check or rewrite the frozen legacy outputs")
    p_gold.add_argument("--write", action="store_true")
    p_gold.add_argument("--arquivo", type=Path, default=GOLDEN_PADRAO)
    p_dif = sub.add_parser("diferencial", help="compare legacy and refactored on random inputs")
    p_dif.add_argument("--n", type=int, default=2000)
    p_dif.add_argument("--seed", type=int, default=2026)
    args = parser.parse_args(argv)
    match args.comando:
        case "complexidade":
            return _complexidade(args.arquivos)
        case "golden":
            return _golden(args.write, args.arquivo)
        case _:
            return _diferencial(args.n, args.seed)


if __name__ == "__main__":
    raise SystemExit(main())
