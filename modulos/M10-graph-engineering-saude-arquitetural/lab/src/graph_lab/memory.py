"""Memória temporal: fatos com validade, nunca delete (lote M10).

Dois eixos de tempo (quando valeu x quando soubemos) permitem não
mentir, responder sobre o passado e auditar. Invalidação fecha
intervalo por símbolo; granularidade de símbolo, idempotente.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class FatoTemporal:
    sujeito: str
    predicado: str
    objeto: str
    confianca: float
    evidencia: str
    valido_de: str
    valido_ate: str | None = None

    @property
    def vigente(self) -> bool:
        return self.valido_ate is None


class MemoriaTemporal:
    """Fatos em JSONL com ciclo de validade completo."""

    def __init__(self, caminho: Path) -> None:
        self._caminho = caminho

    def gravar(self, fato: FatoTemporal) -> None:
        """Acrescenta (imutabilidade do histórico)."""
        with self._caminho.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "sujeito": fato.sujeito,
                        "predicado": fato.predicado,
                        "objeto": fato.objeto,
                        "confianca": fato.confianca,
                        "evidencia": fato.evidencia,
                        "valido_de": fato.valido_de,
                        "valido_ate": fato.valido_ate,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    def _todos(self) -> list[FatoTemporal]:
        if not self._caminho.exists():
            return []
        return [
            FatoTemporal(
                sujeito=r["sujeito"],
                predicado=r["predicado"],
                objeto=r["objeto"],
                confianca=float(r["confianca"]),
                evidencia=r["evidencia"],
                valido_de=r["valido_de"],
                valido_ate=r.get("valido_ate"),
            )
            for linha in self._caminho.read_text(encoding="utf-8").splitlines()
            if linha.strip()
            for r in [json.loads(linha)]
        ]

    def vigentes(self) -> list[FatoTemporal]:
        """O que vale agora."""
        return [f for f in self._todos() if f.vigente]

    def valiam_em(self, commit: str) -> list[FatoTemporal]:
        """O que valia num commit passado (auditoria)."""
        return [
            f
            for f in self._todos()
            if f.valido_de <= commit and (f.valido_ate is None or commit < f.valido_ate)
        ]

    def invalidar(self, sujeito: str, commit: str) -> int:
        """Fecha intervalos do símbolo; idempotente; devolve quantos."""
        todos = self._todos()
        atingidos = 0
        with self._caminho.open("w", encoding="utf-8") as fh:
            for fato in todos:
                if fato.vigente and fato.sujeito == sujeito:
                    fato = FatoTemporal(
                        fato.sujeito,
                        fato.predicado,
                        fato.objeto,
                        fato.confianca,
                        fato.evidencia,
                        fato.valido_de,
                        commit,
                    )
                    atingidos += 1
                fh.write(
                    json.dumps(
                        {
                            "sujeito": fato.sujeito,
                            "predicado": fato.predicado,
                            "objeto": fato.objeto,
                            "confianca": fato.confianca,
                            "evidencia": fato.evidencia,
                            "valido_de": fato.valido_de,
                            "valido_ate": fato.valido_ate,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
        return atingidos
