"""Cache exato com TTL e estatísticas (lote M05).

A chave é o hash da requisição normalizada — prefixo estável primeiro
(sistema, parâmetros, ferramentas) e conteúdo variável por último, a
mesma disciplina que faz o cache do provedor acertar. Hit evita a chamada;
TTL e invalidação explícita evitam resposta velha. Stats respondem quanto
o cache economizou.
"""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass

from llm_gateway.contract import ChatRequest, ChatResponse


@dataclass(slots=True)
class CacheStats:
    hits: int = 0
    misses: int = 0
    evictions: int = 0


@dataclass(slots=True)
class _Entry:
    response: ChatResponse
    expires_at: float


def cache_key(request: ChatRequest) -> str:
    """Chave estável: sistema → parâmetros → mensagens (ordem fixa)."""
    systems = [m.content for m in request.messages if m.role == "system"]
    rest = [
        (m.role, m.name, m.tool_call_id, m.content) for m in request.messages if m.role != "system"
    ]
    payload = {
        "system": systems,
        "params": [request.temperature, request.top_p, request.max_tokens, list(request.stop)],
        "messages": rest,
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


class ExactCache:
    """Cache em memória com TTL em segundos e estatísticas."""

    def __init__(self, ttl_s: float = 300.0) -> None:
        self._ttl_s = ttl_s
        self._store: dict[str, _Entry] = {}
        self.stats = CacheStats()

    def get(self, request: ChatRequest) -> ChatResponse | None:
        """Devolve a resposta em cache ou `None` (miss/expirado)."""
        key = cache_key(request)
        entry = self._store.get(key)
        if entry is None:
            self.stats.misses += 1
            return None
        if time.monotonic() >= entry.expires_at:
            del self._store[key]
            self.stats.evictions += 1
            self.stats.misses += 1
            return None
        self.stats.hits += 1
        return entry.response

    def put(self, request: ChatRequest, response: ChatResponse) -> None:
        """Guarda a resposta com TTL a partir de agora."""
        self._store[cache_key(request)] = _Entry(response, time.monotonic() + self._ttl_s)

    def invalidate(self, request: ChatRequest) -> bool:
        """Remove uma entrada; devolve se existia."""
        return self._store.pop(cache_key(request), None) is not None

    def clear(self) -> None:
        """Limpa tudo (mantém as estatísticas)."""
        self._store.clear()
