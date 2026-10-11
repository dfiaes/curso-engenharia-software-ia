"""A small McCabe-style meter built on ``ast``: cyclomatic complexity and nesting depth.

It counts decision points the way tools such as radon do (branches, loops, handlers,
boolean operators, comprehension clauses, ``match`` cases). It is a signal, not a verdict.
"""

import ast
from dataclasses import dataclass

type FuncDef = ast.FunctionDef | ast.AsyncFunctionDef

_NESTING = (ast.If, ast.For, ast.AsyncFor, ast.While, ast.Try, ast.With, ast.AsyncWith, ast.Match)


@dataclass(frozen=True, slots=True)
class Medida:
    nome: str
    linha: int
    linhas: int
    ciclomatica: int
    aninhamento: int


def _decisoes(no: ast.AST) -> int:
    total = 0
    for filho in ast.walk(no):
        match filho:
            case ast.If() | ast.IfExp() | ast.For() | ast.AsyncFor() | ast.While():
                total += 1
            case ast.ExceptHandler() | ast.match_case():
                total += 1
            case ast.BoolOp():
                total += len(filho.values) - 1
            case ast.comprehension():
                total += 1 + len(filho.ifs)
    return total


def _profundidade(corpo: list[ast.stmt], nivel: int = 0) -> int:
    maior = nivel
    for stmt in corpo:
        if isinstance(stmt, _NESTING):
            blocos: list[list[ast.stmt]] = []
            if isinstance(stmt, ast.Try):
                blocos = [stmt.body, stmt.orelse, stmt.finalbody, *(h.body for h in stmt.handlers)]
            elif isinstance(stmt, ast.Match):
                blocos = [c.body for c in stmt.cases]
            else:
                blocos = [stmt.body]
                orelse = getattr(stmt, "orelse", [])
                if len(orelse) == 1 and isinstance(orelse[0], ast.If):
                    maior = max(maior, _profundidade(orelse, nivel))  # elif: same level
                else:
                    blocos.append(orelse)
            for bloco in blocos:
                maior = max(maior, _profundidade(bloco, nivel + 1))
        elif isinstance(stmt, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef):
            continue
    return maior


def medir_fonte(fonte: str) -> list[Medida]:
    arvore = ast.parse(fonte)
    medidas = []
    for no in ast.walk(arvore):
        if isinstance(no, ast.FunctionDef | ast.AsyncFunctionDef):
            fim = no.end_lineno or no.lineno
            medidas.append(
                Medida(
                    no.name,
                    no.lineno,
                    fim - no.lineno + 1,
                    1 + _decisoes(no),
                    _profundidade(no.body),
                )
            )
    return sorted(medidas, key=lambda m: (-m.ciclomatica, m.nome))
