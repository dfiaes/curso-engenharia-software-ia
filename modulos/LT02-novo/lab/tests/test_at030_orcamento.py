"""Oraculo LT02-AT-030: rajada sob 429/timeout espalha esperas com jitter.

Semente SEED_B04=20260817, amostra 8 concorrentes (sementes 1..8),
base 100ms, teto 800ms, tentativa 3 (espera 400ms + jitter 0..100).
Sem relogio de parede: esperas sao inteiros da agenda. Sem rede.
"""

from __future__ import annotations

from orcamento_retry import OrcamentoRetry

SEED_B04 = 20260817
BASE_MS = 100
TETO_MS = 800
CONCORRENTES = [SEED_B04 + i for i in range(1, 9)]


def test_rajada_espalha_esperas_em_vez_de_sincronizar() -> None:
    orcamento = OrcamentoRetry(max_tentativas=5, orcamento_total=100)
    esperas = [orcamento.atraso_ms(3, BASE_MS, TETO_MS, s) for s in CONCORRENTES]
    assert all(400 <= e <= 500 for e in esperas)
    assert len(set(esperas)) > 1  # jitter dispersa; backoff puro alinharia tudo em 400
    # Determinismo por semente: mesma semente, mesma espera.
    assert orcamento.atraso_ms(3, BASE_MS, TETO_MS, CONCORRENTES[0]) == esperas[0]


def test_backoff_dobra_com_teto_e_tetos_cercam() -> None:
    orcamento = OrcamentoRetry(max_tentativas=3, orcamento_total=5)
    sem_jitter = [
        orcamento.atraso_ms(t, BASE_MS, TETO_MS, 0) - ((0 * 2654435761) % 1000) % 101
        for t in (1, 2, 3, 4)
    ]
    assert sem_jitter == [100, 200, 400, 800]
    assert orcamento.atraso_ms(10, BASE_MS, TETO_MS, 7) <= TETO_MS + BASE_MS
    # Teto por mensagem: 3 tentativas passam, a 4a e recusada.
    assert [orcamento.registrar_tentativa("msg-a") for _ in range(4)] == [
        "tentar",
        "tentar",
        "tentar",
        "recusada:max-tentativas",
    ]
    # Teto global: 2 unidades restantes para outra chave, depois esgota.
    assert orcamento.registrar_tentativa("msg-b") == "tentar"
    assert orcamento.registrar_tentativa("msg-b") == "tentar"
    assert orcamento.registrar_tentativa("msg-b") == "recusada:orcamento-esgotado"
    assert not orcamento.pode_tentar("msg-b")
    assert not orcamento.pode_tentar("msg-a")
