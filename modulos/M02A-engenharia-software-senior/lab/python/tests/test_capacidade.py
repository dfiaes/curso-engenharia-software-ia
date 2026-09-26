"""Oraculos B11-L: estatistica do bruto persistido e saturacao localizada (AT-037/038)."""

from __future__ import annotations

import hashlib
import inspect
import json
import statistics

import pytest
from work_intake.application.capacidade import (
    AMOSTRAS_B11L,
    CARGAS_EXEMPLO,
    CONFIG_B11L,
    DIGEST_B11L,
    JOELHO_B11L,
    RESUMO_B11L,
    SEED_B11L,
    VARREDURA_B11L,
    Amostra,
    CacheVersionado,
    buscar_com_cache,
    construir_corpus,
    custo_unitario_por_avaliacao,
    decidir_carga,
    digest_experimento,
    executar_workload,
    exigir_mesmo_contexto,
    gerar_amostras,
    localizar_joelho,
    pertinencia_conjunto,
    pertinencia_lista,
    resumir,
    varrer_carga,
    verificar_digest,
)

SEED = SEED_B11L


def test_estatistica_recalculada_do_bruto_persistido() -> None:
    """AT-037: p50/p95/erro/throughput derivam das amostras brutas, nunca de anotacao."""
    assert len(AMOSTRAS_B11L) == CONFIG_B11L.n_amostras
    duracoes = [a.duracao_s for a in AMOSTRAS_B11L]
    p50 = statistics.median(duracoes)
    p95 = statistics.quantiles(sorted(duracoes), n=100, method="exclusive")[94]
    erros = sum(1 for a in AMOSTRAS_B11L if not a.ok)
    throughput = len(AMOSTRAS_B11L) / sum(duracoes)
    recalculado = resumir(AMOSTRAS_B11L)
    assert recalculado == RESUMO_B11L
    assert recalculado.p50 == p50
    assert recalculado.p95 == p95
    assert recalculado.erro == erros / len(AMOSTRAS_B11L)
    assert recalculado.throughput == throughput
    assert verificar_digest(SEED, CONFIG_B11L, AMOSTRAS_B11L, DIGEST_B11L)


def test_seed_reproduz_amostra_e_digest() -> None:
    """Evidencia: mesma seed reproduz amostra bruta, resumo e digest canonico."""
    repetidas = gerar_amostras(SEED, CONFIG_B11L.n_amostras, 0.05)
    assert repetidas == AMOSTRAS_B11L
    assert digest_experimento(SEED, CONFIG_B11L, repetidas) == DIGEST_B11L
    assert len(DIGEST_B11L) == 64
    material = json.dumps(
        {"seed": SEED, "resumo": [RESUMO_B11L.p50, RESUMO_B11L.p95], "digest": DIGEST_B11L},
        sort_keys=True,
        separators=(",", ":"),
    )
    assert len(hashlib.sha256(material.encode("utf-8")).hexdigest()) == 64


def test_agregado_sem_bruto_nao_sustenta_estatistica() -> None:
    """AT-037 negativo: vazio nega; bruto adulterado quebra o digest."""
    with pytest.raises(ValueError):
        resumir(())
    primeira = Amostra(duracao_s=9.9, ok=True, veredito="decisao-exemplo")
    adulteradas = (primeira, *AMOSTRAS_B11L[1:])
    assert not verificar_digest(SEED, CONFIG_B11L, adulteradas, DIGEST_B11L)
    with pytest.raises(ValueError):
        gerar_amostras(SEED, 10, 1.5)


def test_workload_real_descarta_warmup_e_preserva_vereditos() -> None:
    """ES26-043: workload no caminho real; warm-up fora; vereditos iguais entre reps."""
    base, alvos = construir_corpus(SEED, 60, 25)
    warmup = 10
    lista = executar_workload("lista", list(base), alvos, warmup)
    conjunto = executar_workload("conjunto", list(base), alvos, warmup)
    assert len(lista) == len(alvos) - warmup == len(conjunto)
    assert [a.veredito for a in lista] == [a.veredito for a in conjunto]
    for amostras in (lista, conjunto):
        resumo = resumir(amostras)
        assert resumo.n == len(alvos) - warmup
        assert resumo.p50 > 0.0 and resumo.p95 >= resumo.p50
    with pytest.raises(ValueError):
        executar_workload("indice-invalido", list(base), alvos, warmup)
    with pytest.raises(ValueError):
        executar_workload("lista", list(base), alvos, -1)


def test_representacoes_concordam_no_mesmo_workload() -> None:
    """ES26-041: lista e conjunto decidem igual; diferem so no custo estimado."""
    base, alvos = construir_corpus(SEED, 40, 20)
    conjunto = frozenset(base)
    for alvo in alvos:
        assert pertinencia_lista(list(base), alvo) == pertinencia_conjunto(conjunto, alvo)


def test_varredura_crescente_localiza_o_joelho() -> None:
    """AT-038: antes do joelho carga vira vazao; depois vira espera."""
    assert JOELHO_B11L is not None
    joelho = JOELHO_B11L
    assert VARREDURA_B11L[joelho].carga == CONFIG_B11L.capacidade + 10
    for i in range(1, joelho):
        assert VARREDURA_B11L[i].vazao > VARREDURA_B11L[i - 1].vazao
        assert VARREDURA_B11L[i].fila == 0
    assert VARREDURA_B11L[joelho].fila > VARREDURA_B11L[joelho - 1].fila
    assert VARREDURA_B11L[joelho].vazao <= VARREDURA_B11L[joelho - 1].vazao
    decisao = decidir_carga(VARREDURA_B11L, joelho, 10)
    assert decisao.carga_operacional == VARREDURA_B11L[joelho].carga - 10
    assert "recusar-explicito" in decisao.consequencia


def test_backpressure_explicito_apos_o_joelho() -> None:
    """AT-038: apos o joelho a recusa e explicita e a fila nao cresce sem limite."""
    assert JOELHO_B11L is not None
    for ponto in VARREDURA_B11L[JOELHO_B11L:]:
        assert ponto.backpressure == "recusar-explicito"
        assert ponto.rejeitadas == ponto.fila == ponto.carga - CONFIG_B11L.capacidade
    antes = VARREDURA_B11L[0]
    assert antes.backpressure == "admitir" and antes.rejeitadas == 0


def test_saturacao_sem_threshold_universal() -> None:
    """AT-038: o joelho nao depende de patamar absoluto; escala nao desloca a dobra."""
    parametros = inspect.signature(localizar_joelho).parameters
    assert "threshold" not in parametros and "patamar" not in parametros
    estreita = varrer_carga(CARGAS_EXEMPLO, CONFIG_B11L.capacidade, janela_s=0.5)
    larga = varrer_carga(CARGAS_EXEMPLO, CONFIG_B11L.capacidade, janela_s=2.0)
    assert localizar_joelho(estreita) == localizar_joelho(larga) == JOELHO_B11L
    assert localizar_joelho(varrer_carga((5, 10, 15), 100)) is None


def test_sem_ranking_entre_maquinas_ou_contextos() -> None:
    """AT-038 negativo: comparar contextos distintos e invalido; mesmo contexto passa."""
    exigir_mesmo_contexto(SEED, CONFIG_B11L, SEED, CONFIG_B11L)
    with pytest.raises(ValueError):
        exigir_mesmo_contexto(SEED, CONFIG_B11L, SEED + 1, CONFIG_B11L)


def test_cache_invalida_por_versao_e_respeita_teto() -> None:
    """ES26-044: acerto so na policy vigente; teto impede crescimento sem limite."""
    cache = CacheVersionado(teto=2, versao_policy=CONFIG_B11L.versao_policy)
    cache.guardar("chave-a", "valor-a")
    valor, acertou = cache.buscar("chave-a")
    assert (valor, acertou) == ("valor-a", True)
    cache.trocar_policy("v2-exemplo")
    assert cache.buscar("chave-a") == (None, False)
    cache.guardar("chave-b", "valor-b")
    cache.guardar("chave-c", "valor-c")
    cache.guardar("chave-d", "valor-d")
    assert len(cache) == 2
    simples: dict[str, dict[str, str]] = {"k": {"valor": "v", "policy": "v1-exemplo"}}
    assert buscar_com_cache("k", "v1-exemplo", simples) == ("v", True)
    assert buscar_com_cache("k", "v2-exemplo", simples) == (None, False)


def test_custo_unitario_exige_outcome_preservado() -> None:
    """ES26-044: custo por avaliacao so vale com vereditos iguais."""
    assert custo_unitario_por_avaliacao(2.0, 4, True) == 0.5
    with pytest.raises(ValueError):
        custo_unitario_por_avaliacao(2.0, 4, False)
    with pytest.raises(ValueError):
        custo_unitario_por_avaliacao(2.0, 0, True)
