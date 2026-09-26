"""Ferramentas do investigador: API pública com sandbox (lote M08).

Três ferramentas sobre um repositório fixture: buscar símbolo, ler
trecho com faixa e registrar fato. Toda ferramenta valida entrada,
confina caminho à raiz, trunca com aviso e devolve erro acionável
(o que houve + por quê + o que fazer). Escopo (raiz) vem da construção,
nunca de argumento preenchido pela política.
"""

from __future__ import annotations

import difflib
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel, Field

MAX_CHARS = 20_000


class BuscarSimboloIn(BaseModel):
    """Argumentos de buscar_simbolo."""

    model_config = {"frozen": True}

    simbolo: str = Field(min_length=2, max_length=120, description="Nome exato do identificador.")
    limite: int = Field(default=20, ge=1, le=50, description="Máximo de ocorrências.")


class LerTrechoIn(BaseModel):
    """Argumentos de ler_trecho."""

    model_config = {"frozen": True}

    caminho: str = Field(description="Caminho relativo à raiz do repositório.")
    linha_ini: int = Field(ge=1, description="Primeira linha (1-based).")
    linha_fim: int = Field(ge=1, description="Última linha (inclusive).")


class NotasRegistrarIn(BaseModel):
    """Argumentos de notas_registrar."""

    model_config = {"frozen": True}

    fato: str = Field(min_length=4, max_length=400, description="Fato estabelecido.")
    evidencia: str = Field(min_length=3, max_length=200, description="arquivo:linha que prova.")


@dataclass(frozen=True, slots=True)
class ToolDefinition:
    name: str
    description: str
    model: type[BaseModel]
    fn: Callable[[dict[str, object]], str]


@dataclass(frozen=True, slots=True)
class ToolContext:
    repo_root: Path
    memory_file: Path


def _confinar(raiz: Path, caminho: str) -> Path | str:
    """Resolve contra a raiz; fora dela devolve mensagem de erro."""
    alvo = (raiz / caminho).resolve()
    if not alvo.is_relative_to(raiz.resolve()):
        return "ERRO: caminho fora do repositório. Use caminho relativo à raiz."
    return alvo


def buscar_simbolo(ctx: ToolContext, entrada: BuscarSimboloIn) -> str:
    """Ocorrências exatas com caminho:linha e trecho."""
    achados: list[str] = []
    for arquivo in sorted(ctx.repo_root.rglob("*.py")):
        try:
            linhas = arquivo.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        for n, linha in enumerate(linhas, 1):
            if entrada.simbolo in linha:
                achados.append(f"{arquivo.relative_to(ctx.repo_root)}:{n}: {linha.strip()[:120]}")
                if len(achados) >= entrada.limite:
                    return "\n".join(achados) + f"\n[limite de {entrada.limite} atingido]"
    if not achados:
        return (
            f"Nenhuma ocorrência de {entrada.simbolo!r}. "
            "Verifique a grafia ou tente um nome parcial."
        )
    return "\n".join(achados)


def ler_trecho(ctx: ToolContext, entrada: LerTrechoIn) -> str:
    """Faixa de linhas com truncamento avisado."""
    alvo = _confinar(ctx.repo_root, entrada.caminho)
    if isinstance(alvo, str):
        return alvo
    if not alvo.is_file():
        parecidos = difflib.get_close_matches(
            entrada.caminho,
            [str(p.relative_to(ctx.repo_root)) for p in ctx.repo_root.rglob("*.py")],
        )
        sugestao = f" Caminhos parecidos: {parecidos}." if parecidos else ""
        return f"ERRO: {entrada.caminho!r} não existe.{sugestao} Use buscar_simbolo para localizar."
    texto = alvo.read_text(encoding="utf-8", errors="replace")
    if len(texto) > MAX_CHARS:
        return (
            texto[:MAX_CHARS] + "\n\n[TRUNCADO em 20k chars — peça faixa com linha_ini/linha_fim]"
        )
    return texto


def notas_registrar(ctx: ToolContext, entrada: NotasRegistrarIn) -> str:
    """Grava fato com evidência no arquivo de memória."""
    with ctx.memory_file.open("a", encoding="utf-8") as fh:
        fh.write(f"- {entrada.fato} [{entrada.evidencia}]\n")
    return "registrado"


def make_tools(ctx: ToolContext) -> dict[str, ToolDefinition]:
    """Registro: schema + implementação juntos, escopo já fixado."""
    return {
        "buscar_simbolo": ToolDefinition(
            name="buscar_simbolo",
            description=(
                "Localiza onde um identificador aparece. Use quando tiver o nome exato. "
                "NÃO use para pergunta conceitual."
            ),
            model=BuscarSimboloIn,
            fn=lambda entrada: buscar_simbolo(ctx, BuscarSimboloIn.model_validate(entrada)),
        ),
        "ler_trecho": ToolDefinition(
            name="ler_trecho",
            description=(
                "Lê faixa de linhas de um arquivo. Use depois de localizar o caminho. "
                "Sempre com linha_ini/linha_fim, nunca o arquivo inteiro."
            ),
            model=LerTrechoIn,
            fn=lambda entrada: ler_trecho(ctx, LerTrechoIn.model_validate(entrada)),
        ),
        "notas_registrar": ToolDefinition(
            name="notas_registrar",
            description="Grava fato estabelecido com evidência arquivo:linha.",
            model=NotasRegistrarIn,
            fn=lambda entrada: notas_registrar(ctx, NotasRegistrarIn.model_validate(entrada)),
        ),
    }
