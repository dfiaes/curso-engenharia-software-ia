"""Extração determinística do grafo de código via AST (lote M10).

Parser, não LLM: tipos, métodos e chamadas com fqn estável. O que a
heurística sintática não resolve vai para `nao_resolvidos` — candidatos
a desambiguação, nunca invenção silenciosa.
"""

from __future__ import annotations

import ast
import builtins
from dataclasses import dataclass, field

from graph_lab.digraph import DiGraph


@dataclass(slots=True)
class GrafoExtraido:
    g: DiGraph = field(default_factory=DiGraph)
    nao_resolvidos: list[str] = field(default_factory=list)


def _fqn(modulo: str, classe: str | None, nome: str) -> str:
    base = f"{modulo}.{classe}" if classe else modulo
    return f"{base}.{nome}"


def extrair(modulo: str, fonte: str) -> GrafoExtraido:
    """Extrai tipos, métodos e chamadas CHAMA com linha."""
    resultado = GrafoExtraido()
    try:
        arvore = ast.parse(fonte)
    except SyntaxError:
        return resultado
    definidos = {
        no.name
        for no in arvore.body
        if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
    }
    for no in arvore.body:
        if isinstance(no, ast.ClassDef):
            fqn_tipo = f"{modulo}.{no.name}"
            resultado.g.add_no(fqn_tipo, tipo="Tipo", abstrato=_eh_abstrato(no), caminho=modulo)
            for membro in no.body:
                if not isinstance(membro, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    continue
                _extrair_metodo(resultado, modulo, fqn_tipo, membro, no.name, definidos)
        elif isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
            _extrair_metodo(resultado, modulo, None, no, "", definidos)
    return resultado


def _extrair_metodo(
    resultado: GrafoExtraido,
    modulo: str,
    fqn_tipo: str | None,
    membro: ast.FunctionDef | ast.AsyncFunctionDef,
    classe: str,
    definidos: set[str],
) -> None:
    fqn_met = f"{fqn_tipo}.{membro.name}" if fqn_tipo else f"{modulo}.{membro.name}"
    fim = membro.end_lineno or membro.lineno
    resultado.g.add_no(
        fqn_met, tipo="Metodo", linha_ini=membro.lineno, linha_fim=fim, caminho=modulo
    )
    if fqn_tipo:
        resultado.g.add_aresta(fqn_tipo, fqn_met, "DECLARA")
    for chamada, linha in _chamadas(membro):
        alvo = _resolver(chamada, classe, modulo, definidos)
        if alvo is None:
            resultado.nao_resolvidos.append(f"{modulo}:{linha}: {chamada}")
        else:
            resultado.g.add_aresta(fqn_met, alvo, "CHAMA", linha=linha)


def _eh_abstrato(no: ast.ClassDef) -> bool:
    return any(
        (isinstance(b, ast.Name) and b.id == "ABC")
        or (isinstance(b, ast.Attribute) and b.attr == "ABC")
        for b in no.bases
    ) or any(
        any(isinstance(d, ast.Name) and d.id == "abstractmethod" for d in m.decorator_list)
        for m in no.body
        if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))
    )


def _chamadas(no: ast.AST) -> list[tuple[str, int]]:
    saida: list[tuple[str, int]] = []
    for filho in ast.walk(no):
        if isinstance(filho, ast.Call):
            func = filho.func
            if isinstance(func, ast.Name):
                saida.append((func.id, filho.lineno))
            elif isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name):
                saida.append((f"{func.value.id}.{func.attr}", filho.lineno))
    return saida


def _resolver(chamada: str, classe_atual: str, modulo: str, definidos: set[str]) -> str | None:
    if "." in chamada:
        dono, metodo = chamada.rsplit(".", 1)
        if dono in ("self", "cls") and classe_atual:
            return f"{modulo}.{classe_atual}.{metodo}"
        if dono in definidos:
            return f"{modulo}.{dono}.{metodo}"
        return None
    if chamada in dir(builtins):
        return None
    if chamada in definidos:
        return f"{modulo}.{chamada}"
    if classe_atual:
        return f"{modulo}.{classe_atual}.{chamada}"
    return None
