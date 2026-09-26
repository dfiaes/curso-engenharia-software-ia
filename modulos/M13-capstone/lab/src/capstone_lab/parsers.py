"""Porta ``LanguageParser`` e duas implementações (M13 B4).

Invariante: um parser transforma texto-fonte em símbolos, relações e erros
medidos — nunca silencia erro de parse. Adapters:

1. ``PythonAstParser``: usa o módulo ``ast`` da stdlib (gramática oficial do
   interpretador), extrai funções, classes, imports e chamadas diretas.
2. ``MiniLangParser``: parser de segunda linguagem construído com regex cujos
   padrões derivam de uma gramática EBNF local e documentada (ver docstring da
   classe). Demonstra que a porta suporta linguagens sem parser dedicado —
   com limitações explícitas medidas pelo corpus dourado.

Tree-sitter (alvo da especificação) está registrado como BLOCKED neste Tier:
binários/gramáticas nativas não disponíveis no ambiente; a porta já aceita um
adapter Tree-sitter sem mudar o contrato.
"""

from __future__ import annotations

import ast
import json
import re
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True)
class Symbol:
    kind: str  # "function" | "class"
    name: str
    line: int


@dataclass(frozen=True)
class Relation:
    kind: str  # "imports" | "calls"
    source: str
    target: str
    line: int


@dataclass(frozen=True)
class ParseError:
    line: int
    message: str


@dataclass
class ParseResult:
    language: str
    path: str
    symbols: list[Symbol] = field(default_factory=list)
    relations: list[Relation] = field(default_factory=list)
    errors: list[ParseError] = field(default_factory=list)


class LanguageParser(Protocol):
    """Porta: toda linguagem suportada implementa esta interface."""

    language_id: str

    def parse(self, path: str, source: str) -> ParseResult: ...


class PythonAstParser:
    """Parser Python via ``ast`` — gramática oficial do interpretador."""

    language_id = "python"

    def parse(self, path: str, source: str) -> ParseResult:
        result = ParseResult(language=self.language_id, path=path)
        try:
            tree = ast.parse(source)
        except SyntaxError as exc:
            result.errors.append(
                ParseError(line=exc.lineno or 0, message=f"SyntaxError: {exc.msg}")
            )
            return result
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                result.symbols.append(Symbol("function", node.name, node.lineno))
            elif isinstance(node, ast.ClassDef):
                result.symbols.append(Symbol("class", node.name, node.lineno))
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    result.relations.append(Relation("imports", path, alias.name, node.lineno))
            elif isinstance(node, ast.ImportFrom) and node.module:
                result.relations.append(Relation("imports", path, node.module, node.lineno))
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                result.relations.append(Relation("calls", path, node.func.id, node.lineno))
        result.symbols.sort(key=lambda s: s.line)
        result.relations.sort(key=lambda r: r.line)
        return result


class MiniLangParser:
    r"""Parser de segunda linguagem via regex sobre gramática EBNF local.

    Gramática "minilang" (v1, documentada aqui e congelada nos fixtures):

        program  = { line } ;
        line     = func_decl | call_stmt | let_stmt | blank ;
        func_decl= "func" name "(" [ name { "," name } ] ")" ;
        call_stmt= "call" name "(" [ name { "," name } ] ")" ;
        let_stmt = "let" name "=" name ;
        name     = /[a-z_][a-z0-9_]*/ ;

    Limitação declarada: não há blocos/aninhamento; linha inválida vira
    ``ParseError`` medido e o restante do arquivo continua sendo analisado.
    """

    language_id = "minilang"

    _NAME = r"[a-z_][a-z0-9_]*"
    _ARGS = r"(?:\s*NAME\s*(?:,\s*NAME\s*)*)?".replace("NAME", _NAME)
    _FUNC = re.compile(rf"^func\s+({_NAME})\s*\(({_ARGS})\)$")
    _CALL = re.compile(rf"^call\s+({_NAME})\s*\(({_ARGS})\)$")
    _LET = re.compile(rf"^let\s+({_NAME})\s*=\s*({_NAME})$")

    def parse(self, path: str, source: str) -> ParseResult:
        result = ParseResult(language=self.language_id, path=path)
        for lineno, raw in enumerate(source.splitlines(), start=1):
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if m := self._FUNC.match(line):
                result.symbols.append(Symbol("function", m.group(1), lineno))
            elif m := self._CALL.match(line):
                result.relations.append(Relation("calls", path, m.group(1), lineno))
            elif m := self._LET.match(line):
                result.relations.append(Relation("binds", path, m.group(2), lineno))
            else:
                result.errors.append(ParseError(line=lineno, message=f"linha inválida: {line!r}"))
        return result


def golden_corpus_check(fixture: Path, parser: LanguageParser) -> list[str]:
    """Compara o parse de ``fixture`` com o arquivo dourado ``<nome>.golden.json``.

    Retorna lista de diferenças; lista vazia = 100% do contrato reproduzido.
    """
    golden_path = fixture.with_suffix(fixture.suffix + ".golden.json")
    expected = json.loads(golden_path.read_text(encoding="utf-8"))
    got = parser.parse(fixture.name, fixture.read_text(encoding="utf-8"))
    actual = {
        "symbols": [asdict(s) for s in got.symbols],
        "relations": [asdict(r) for r in got.relations],
        "errors": [asdict(e) for e in got.errors],
    }
    diffs: list[str] = []
    for key in ("symbols", "relations", "errors"):
        if actual[key] != expected[key]:
            diffs.append(f"{fixture.name}: campo '{key}' diverge do corpus dourado")
    return diffs
