"""Provedor local atras da porta do M05; sem servidor, sem rede.

Referencia executavel do Bloco 7.
Implementacao verbatim na folha B07-L. So STDLIB.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any

Transporte = Callable[[str, Mapping[str, Any]], Mapping[str, Any]]
"""Recebe (url, corpo) e devolve o JSON ja decodificado."""


@dataclass(frozen=True, slots=True)
class ConfigOllama:
    host: str = "127.0.0.1"
    porta: int = 11434
    modelo: str = "local-8b-q4"
    n_ctx: int = 8192
    keep_alive: str = "5m"
    paralelo: int = 1
    exige_auth_no_proxy: bool = True


def politica_host(cfg: ConfigOllama) -> str:
    """Recusa 0.0.0.0 sem proxy autenticado; devolve base_url."""
    if cfg.host == "0.0.0.0" and cfg.exige_auth_no_proxy:
        raise ValueError("0.0.0.0 exige proxy autenticado")
    return f"http://{cfg.host}:{cfg.porta}/v1"


def validar_local(cfg: ConfigOllama, prompt_estimado: int) -> list[str]:
    """Valida knobs sem servidor; lista vazia aprova."""
    erros: list[str] = []
    if cfg.n_ctx < prompt_estimado:
        erros.append("num_ctx menor que o prompt: system sera truncado")
    if cfg.paralelo < 1:
        erros.append("paralelo minimo e 1")
    if cfg.keep_alive not in ("-1", "0") and not cfg.keep_alive.endswith("m"):
        erros.append("keep_alive deve ser '-1', '0' ou minutos")
    return erros


@dataclass(frozen=True, slots=True)
class Uso:
    entrada: int
    saida: int
    custo_usd: float = 0.0


@dataclass(frozen=True, slots=True)
class Resposta:
    texto: str
    uso: Uso
    confianca: float | None
    provedor: str
    modelo: str


class OllamaProvider:
    """Adapter OpenAI-compativel sobre transporte injetavel."""

    nome = "ollama"

    def __init__(self, cfg: ConfigOllama, transporte: Transporte) -> None:
        self._cfg = cfg
        self._transporte = transporte
        self._base = politica_host(cfg)

    def completar(self, mensagens: list[dict[str, str]]) -> Resposta:
        corpo: dict[str, Any] = {
            "model": self._cfg.modelo,
            "messages": mensagens,
            "options": {"num_ctx": self._cfg.n_ctx},
            "keep_alive": self._cfg.keep_alive,
        }
        bruta = self._transporte(self._base + "/chat/completions", corpo)
        uso = bruta.get("usage", {})
        lps = bruta.get("logprobs", [])
        conf = (sum(lps) / len(lps)) if lps else None
        texto = str(bruta.get("text", ""))
        return Resposta(
            texto=texto,
            uso=Uso(int(uso.get("prompt", 0)), int(uso.get("completion", 0)), 0.0),
            confianca=conf,
            provedor=self.nome,
            modelo=self._cfg.modelo,
        )
