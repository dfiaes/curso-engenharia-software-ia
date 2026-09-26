"""Memória de fatos com evidência e invalidação (lote M08).

Observação temporária não vira memória; fato durável exige evidência
(arquivo:linha) e gatilho de invalidação (commit/arquivo alterado).
Servir fato velho gera afirmação confiante e errada — por isso
invalidação é operação de primeira classe, não faxina.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Fato:
    texto: str
    evidencia: str
    origem: str
    valido_para: str
    invalidado_em: str | None = None

    @property
    def vigente(self) -> bool:
        return self.invalidado_em is None


class MemoriaFatos:
    """Fatos persistidos em JSONL com leitura de vigentes."""

    def __init__(self, caminho: Path) -> None:
        self._caminho = caminho

    def gravar(self, fato: Fato) -> None:
        """Acrescenta um fato (nunca edita: imutabilidade do histórico)."""
        with self._caminho.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "texto": fato.texto,
                        "evidencia": fato.evidencia,
                        "origem": fato.origem,
                        "valido_para": fato.valido_para,
                        "invalidado_em": fato.invalidado_em,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    def _todos(self) -> list[Fato]:
        if not self._caminho.exists():
            return []
        return [
            Fato(
                texto=r["texto"],
                evidencia=r["evidencia"],
                origem=r["origem"],
                valido_para=r["valido_para"],
                invalidado_em=r.get("invalidado_em"),
            )
            for linha in self._caminho.read_text(encoding="utf-8").splitlines()
            if linha.strip()
            for r in [json.loads(linha)]
        ]

    def vigentes(self) -> list[Fato]:
        """Fatos ainda válidos, em ordem de gravação."""
        return [f for f in self._todos() if f.vigente]

    def invalidar_por_arquivo(self, caminho: str, quando: str) -> int:
        """Invalida fatos cuja evidência aponta ao arquivo; devolve quantos."""
        todos = self._todos()
        atingidos = 0
        with self._caminho.open("w", encoding="utf-8") as fh:
            for fato in todos:
                if fato.vigente and fato.evidencia.startswith(caminho):
                    fato = Fato(fato.texto, fato.evidencia, fato.origem, fato.valido_para, quando)
                    atingidos += 1
                fh.write(
                    json.dumps(
                        {
                            "texto": fato.texto,
                            "evidencia": fato.evidencia,
                            "origem": fato.origem,
                            "valido_para": fato.valido_para,
                            "invalidado_em": fato.invalidado_em,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
        return atingidos
