"""Validacao estatica de Dockerfile: non-root, base minima, digest pinado.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (re).
Nao executa Docker: le texto, publica veredito.
"""

from __future__ import annotations

import re

PADRAO_INSTRUCAO = re.compile(r"^\s*([A-Za-z]+)\s+(.*?)\s*$")
PADRAO_SECRETO = re.compile(r"(senha|secret|token|api[_-]?key|passwd)", re.IGNORECASE)
VARIANTES_MINIMAS = ("slim", "alpine", "distroless")


def instrucoes(texto: str) -> list[tuple[str, str]]:
    """Cada linha valida vira (INSTRUCAO, argumentos); ignora vazias e comentarios."""
    saidas: list[tuple[str, str]] = []
    for linha in texto.splitlines():
        sem_comentario = linha.split("#", 1)[0]
        if not sem_comentario.strip():
            continue
        casa = PADRAO_INSTRUCAO.match(sem_comentario)
        if casa:
            saidas.append((casa.group(1).upper(), casa.group(2).strip()))
    return saidas


def usuario_final(texto: str) -> str | None:
    """Ultimo USER declarado; None se ausente (roda como root)."""
    usuarios = [args.split()[0] for nome, args in instrucoes(texto) if nome == "USER"]
    return usuarios[-1] if usuarios else None


def bases(texto: str) -> list[str]:
    """Toda imagem apos cada FROM, na ordem de declaracao."""
    return [args.split()[0] for nome, args in instrucoes(texto) if nome == "FROM"]


def digest_pinado_na_base_final(texto: str) -> bool:
    """A ultima base referencia conteudo exato via '@sha256:'."""
    lista = bases(texto)
    return bool(lista) and "@sha256:" in lista[-1]


def base_minima(texto: str) -> bool:
    """Heuristica local: a base final nomeia variante enxuta.

    Nao mede tamanho; o tamanho real e medido na trilha externa.
    """
    lista = bases(texto)
    return bool(lista) and any(v in lista[-1].lower() for v in VARIANTES_MINIMAS)


def expoe_segredo(texto: str) -> bool:
    """True se ARG/ENV carrega nome de segredo ou COPY traz arquivo sensivel."""
    for nome, args in instrucoes(texto):
        if nome in ("ARG", "ENV") and PADRAO_SECRETO.search(args):
            return True
        if nome == "COPY" and PADRAO_SECRETO.search(args):
            return True
    return False


def relatorio(texto: str) -> dict[str, object]:
    """Junta as verificacoes; 'aprovada' exige todas as condicoes."""
    usuario = usuario_final(texto)
    vereditos: dict[str, object] = {
        "usuario_final": usuario,
        "nao_root": usuario is not None and usuario != "root" and usuario != "0",
        "bases": bases(texto),
        "digest_pinado": digest_pinado_na_base_final(texto),
        "base_minima": base_minima(texto),
        "expoe_segredo": expoe_segredo(texto),
    }
    vereditos["aprovada"] = bool(
        vereditos["nao_root"]
        and vereditos["digest_pinado"]
        and vereditos["base_minima"]
        and not vereditos["expoe_segredo"]
    )
    return vereditos
