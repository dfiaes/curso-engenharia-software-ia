"""Bloqueia comandos destrutivos.

O Claude Code envia os dados do evento como JSON no stdin do hook.
Sair com código 2 cancela a ferramenta e devolve o stderr ao modelo.
"""
import json
import sys

PROIBIDOS = ("rm -rf", "git push --force", "DROP TABLE", "format ")

dados = json.load(sys.stdin)
comando = dados.get("tool_input", {}).get("command", "")

for padrao in PROIBIDOS:
    if padrao.lower() in comando.lower():
        print(f"BLOQUEADO: comando contém '{padrao}'.", file=sys.stderr)
        sys.exit(2)

sys.exit(0)