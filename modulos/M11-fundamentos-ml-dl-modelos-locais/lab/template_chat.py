"""Renderizador local de chat template; sem modelo, sem rede.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB.
"""

MARCADORES: dict[str, dict[str, str]] = {
    "familia-a": {"inicio": "<|im_start|>", "fim": "<|im_end|>"},
}


def renderizar(papeis: list[tuple[str, str]], familia: str) -> str:
    """Monta a sequencia de marcadores da familia."""
    marc = MARCADORES[familia]
    partes: list[str] = []
    for papel, texto in papeis:
        partes.append(f"{marc['inicio']}{papel}\n{texto}{marc['fim']}\n")
    partes.append(f"{marc['inicio']}assistant\n")
    return "".join(partes)


def detectar_base_vs_instruct(texto: str, familia: str) -> str:
    """'base' se nao ha marcador; 'instruct' se ha."""
    marc = MARCADORES[familia]
    if marc["inicio"] not in texto:
        return "base"
    return "instruct"


def diagnosticar_template(texto: str, familia: str) -> str:
    """'ok', 'base-sem-template' ou 'template-errado'."""
    if detectar_base_vs_instruct(texto, familia) == "base":
        return "base-sem-template"
    for outra, marc in MARCADORES.items():
        if outra != familia and marc["inicio"] in texto:
            return "template-errado"
    return "ok"
