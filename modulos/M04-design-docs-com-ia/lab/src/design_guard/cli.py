"""Ponto de entrada do verificador (lote M04)."""

from __future__ import annotations

import argparse
from pathlib import Path

from design_guard.rules import (
    Violacao,
    checar_adr,
    checar_mermaid,
    checar_obsolescencia,
    checar_referencias,
    documenta_alvo,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Linter determinístico de documentação")
    parser.add_argument("--raiz", type=Path, default=Path("."))
    args = parser.parse_args()
    raiz: Path = args.raiz.resolve()

    docs = sorted(p for p in raiz.rglob("*.md") if ".venv" not in p.parts)
    violacoes: list[Violacao] = []
    for doc in docs:
        violacoes += checar_referencias(doc, raiz)
        violacoes += checar_adr(doc)
        violacoes += checar_mermaid(doc)
        if (alvo := documenta_alvo(doc)) is not None:
            violacoes += checar_obsolescencia(doc, raiz, alvo)

    print(f"doc_lint: {len(docs)} documentos analisados")
    for v in violacoes:
        print(f"  {v}")
    if violacoes:
        print(f"DOC LINT FALHOU — {len(violacoes)} violação(ões)")
        raise SystemExit(1)
    print("DOC LINT OK")


if __name__ == "__main__":
    main()
