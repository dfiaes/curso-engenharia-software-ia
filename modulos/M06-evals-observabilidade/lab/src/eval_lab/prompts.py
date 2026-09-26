"""Registry de prompts: versão é configuração, não código (lote M06).

Arquivo por versão, imutável após uso em produção, tag `id@vN` em todo
log e resultado. Sem tag, nada é comparável.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent / "prompts"


@dataclass(frozen=True, slots=True)
class Prompt:
    id: str
    versao: int
    texto: str
    modelo_alvo: str
    temperatura: float

    @property
    def tag(self) -> str:
        """Identificador que vai em todo log, trace e resultado."""
        return f"{self.id}@v{self.versao}"


def carregar(id_prompt: str, versao: int | None = None, raiz: Path = RAIZ) -> Prompt:
    """Carrega prompt por id + versão (None = maior versão)."""
    pasta = raiz / id_prompt
    if versao is None:
        versoes = [int(p.stem[1:]) for p in pasta.glob("v*.md")]
        versao = max(versoes)
    bruto = (pasta / f"v{versao}.md").read_text(encoding="utf-8")
    _, frente, corpo = bruto.split("---", 2)
    meta = dict(re.findall(r"^(\w+):\s*(.+)$", frente, flags=re.MULTILINE))
    return Prompt(
        id=id_prompt,
        versao=versao,
        texto=corpo.strip(),
        modelo_alvo=str(meta.get("modelo_alvo", "padrao")),
        temperatura=float(meta.get("temperatura", 0)),
    )
