"""Chunking: fixo (baseline) e estrutural via AST (lote M07).

A unidade sintática (função, classe, método) é a granularidade da
pergunta — por isso o estrutural vence o fixo em código. `id_estavel`
sobrevive a mudança de linha e viabiliza ingestão incremental.
"""

from __future__ import annotations

import ast
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Chunk:
    caminho: str
    simbolo: str
    tipo: str  # "funcao" | "classe" | "metodo" | "bloco"
    linha_ini: int
    linha_fim: int
    texto: str

    @property
    def id_estavel(self) -> str:
        """Chave que sobrevive a mudança de linha (símbolo, não posição)."""
        return f"{self.caminho}::{self.simbolo}"


def dividir_fixo(caminho: str, fonte: str, tamanho: int = 20, overlap: int = 4) -> list[Chunk]:
    """Baseline ruim: fatias por linha, podendo cortar no meio da ideia."""
    linhas = fonte.splitlines()
    chunks: list[Chunk] = []
    i, n = 0, 0
    passo = max(1, tamanho - overlap)
    while i < len(linhas):
        bloco = linhas[i : i + tamanho]
        n += 1
        chunks.append(
            Chunk(caminho, f"bloco-{n}", "bloco", i + 1, i + len(bloco), "\n".join(bloco))
        )
        i += passo
    return chunks


def dividir_estrutural(caminho: str, fonte: str) -> list[Chunk]:
    """Uma unidade sintática por chunk, via `ast` (sem regex em sintaxe)."""
    try:
        arvore = ast.parse(fonte)
    except SyntaxError:
        return dividir_fixo(caminho, fonte)
    linhas = fonte.splitlines()
    chunks: list[Chunk] = []
    for no in arvore.body:
        if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            tipo = "classe" if isinstance(no, ast.ClassDef) else "funcao"
            fim = getattr(no, "end_lineno", None) or no.lineno
            texto = "\n".join(linhas[no.lineno - 1 : fim])
            chunks.append(Chunk(caminho, no.name, tipo, no.lineno, fim, texto))
            for filho in ast.walk(no):
                if filho is not no and isinstance(filho, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    ffim = getattr(filho, "end_lineno", None) or filho.lineno
                    ftexto = "\n".join(linhas[filho.lineno - 1 : ffim])
                    chunks.append(
                        Chunk(
                            caminho, f"{no.name}.{filho.name}", "metodo", filho.lineno, ffim, ftexto
                        )
                    )
    if not chunks:
        return dividir_fixo(caminho, fonte)
    return sorted(chunks, key=lambda c: (c.linha_ini, -c.linha_fim))
