#!/usr/bin/env python3
"""Gera tokens.css a partir de tokens.json do design system Trilha.

Uso (a partir da raiz do repositório):
    python3 assets/trilha/gerar_tokens_css.py [tokens.json] [tokens.css]

Sem argumentos, lê assets/trilha/tokens.json e escreve assets/trilha/tokens.css.

Regras:
- :root traz o tema claro, as sombras claras, espaçamentos, raios, larguras,
  materiais de vidro e as famílias de fonte.
- @media (prefers-color-scheme: dark) aplica o tema escuro ao :root, exceto
  quando o próprio :root tem data-theme="light" ou "paper".
- :root[data-theme="dark"] força o tema escuro.
- [data-theme="paper"] aplica o tema papel (sépia para leitura) a qualquer
  elemento; tudo dentro dele muda. Token sem valor "paper" no tokens.json cai
  para o valor claro.
- Nenhum token é renomeado: o nome CSS é "--" + nome do token.

Só usa a biblioteca padrão do Python.
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAPER_KEY = "paper"


def _pair(value, theme):
    """Valor de um token para um tema, com fallback para o claro."""
    if isinstance(value, dict):
        if theme in value:
            return value[theme]
        return value["light"]
    return value


def _decl(name, value, indent):
    return f"{indent}--{name}: {value};"


def gerar(dados):
    colors = dados["color"]["tokens"]
    shadows = dados["shadow"]["tokens"]
    spacing = dados["spacing"]["tokens"]
    radius = dados["radius"]["tokens"]
    size = dados.get("size", {}).get("tokens", [])
    material = dados.get("material", {}).get("tokens", [])
    families = dados["type"]["families"]

    linhas = []
    add = linhas.append

    add("/* Trilha tokens: gerado de tokens.json por assets/trilha/gerar_tokens_css.py (não editar à mão) */")

    # Tema claro (padrão).
    add(":root {")
    add("  color-scheme: light;")
    for t in colors:
        add(_decl(t["name"], _pair(t["value"], "light"), "  "))
    for t in shadows:
        add(_decl(t["name"], _pair(t["value"], "light"), "  "))
    for t in spacing + radius + size + material:
        add(_decl(t["name"], t["value"], "  "))
    for fam, pilha in families.items():
        add(_decl(f"font-{fam}", pilha, "  "))
    add("}")

    def bloco_escuro(seletor):
        add(seletor + " {")
        add("    color-scheme: dark;")
        for t in colors:
            add(_decl(t["name"], _pair(t["value"], "dark"), "    "))
        for t in shadows:
            add(_decl(t["name"], _pair(t["value"], "dark"), "    "))
        add("  }")

    # Escuro por preferência do sistema, sem escolha explícita de tema.
    add("@media (prefers-color-scheme: dark) {")
    bloco_escuro(':root:not([data-theme="light"]):not([data-theme="paper"])')
    add("}")

    # Escuro explícito.
    add(":root[data-theme=\"dark\"] {")
    add("  color-scheme: dark;")
    for t in colors:
        add(_decl(t["name"], _pair(t["value"], "dark"), "  "))
    for t in shadows:
        add(_decl(t["name"], _pair(t["value"], "dark"), "  "))
    add("}")

    # Papel (sépia para leitura), em qualquer elemento.
    add("[data-theme=\"paper\"] {")
    add("  color-scheme: light;")
    for t in colors:
        add(_decl(t["name"], _pair(t["value"], PAPER_KEY), "  "))
    for t in shadows:
        add(_decl(t["name"], _pair(t["value"], "light"), "  "))
    add("}")

    return "\n".join(linhas) + "\n"


def main(argv):
    origem = Path(argv[1]) if len(argv) > 1 else HERE / "tokens.json"
    destino = Path(argv[2]) if len(argv) > 2 else HERE / "tokens.css"
    dados = json.loads(origem.read_text(encoding="utf-8"))
    destino.write_text(gerar(dados), encoding="utf-8")
    print(f"ok: {destino}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
