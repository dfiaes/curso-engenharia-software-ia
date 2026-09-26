"""Amostragem sobre listas de logits; sem modelo, sem rede.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (math).
"""

import math

LOGITS_EXEMPLO: list[float] = [3.2, 2.9, 1.4, 0.8, 0.1, -0.5, -1.2]


def softmax(logits: list[float]) -> list[float]:
    """Exponencial normalizada; preserva a ordem."""
    m = max(logits)
    exps = [math.exp(x - m) for x in logits]
    total = sum(exps)
    return [e / total for e in exps]


def aplicar_temperatura(logits: list[float], t: float) -> list[float]:
    """Divide por T e aplica softmax; T <= 0 vira greedy."""
    if t <= 0.0:
        return greedy(logits)
    return softmax([x / t for x in logits])


def top_k(probs: list[float], k: int) -> list[float]:
    """Zera fora do top-k e renormaliza."""
    idx = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)[:k]
    rec = [0.0] * len(probs)
    for i in idx:
        rec[i] = probs[i]
    total = sum(rec)
    return [v / total for v in rec]


def top_p(probs: list[float], p: float) -> list[float]:
    """Menor conjunto com massa >= p; renormaliza."""
    ordem = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)
    acc = 0.0
    keep: set[int] = set()
    for i in ordem:
        keep.add(i)
        acc += probs[i]
        if acc >= p:
            break
    rec = [probs[i] if i in keep else 0.0 for i in range(len(probs))]
    total = sum(rec)
    return [v / total for v in rec]


def entropia(probs: list[float]) -> float:
    """Entropia em nats; mede a dispersao."""
    return -sum(v * math.log(v) for v in probs if v > 0.0)


def greedy(logits: list[float]) -> list[float]:
    """One-hot no argmax; limite de T -> 0."""
    top = max(range(len(logits)), key=lambda i: logits[i])
    return [1.0 if i == top else 0.0 for i in range(len(logits))]
