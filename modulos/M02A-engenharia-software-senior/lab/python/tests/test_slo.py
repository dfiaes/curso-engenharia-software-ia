"""Oraculos B10-L: trace 4 elos, SLI/SLO/budget com decisao e runbook (AT-033 guarda)."""

from __future__ import annotations

import hashlib
import json
import random

import pytest
from work_intake.application.slo import (
    AMOSTRAS_B10L,
    DECISAO_CONTER,
    DECISAO_LIBERAR,
    DIGEST_B10L,
    N_BOAS_EXEMPLO,
    N_RUINS_EXEMPLO,
    POLITICA_B10L,
    SEED_B10L,
    NegacaoMetrica,
    PoliticaSLO,
    Postmortem,
    SerieMetrica,
    budget_restante,
    campo_para_log,
    construir_trace,
    decidir,
    digest_amostras,
    elos_da_avaliacao,
    exercitar_db_locked,
    exercitar_overload,
    exercitar_provider_indisponivel,
    exercitar_rollback,
    gerar_amostras,
    redigir,
    rotular_para_metrica,
    sli,
    trace_completo,
    varrer_metrica,
)

SEED = SEED_B10L
CANARIO = f"canary-{random.Random(SEED).getrandbits(64):016x}"
CORRELATION_ID = f"corr-{random.Random(SEED + 1).getrandbits(32):08x}"
TENANT = "tenant-acme"
TRACE_ID = f"trace-{random.Random(SEED + 2).getrandbits(64):016x}"


def _digest_evidencia() -> str:
    material = json.dumps(
        {"seed": SEED, "amostras": list(AMOSTRAS_B10L), "digest": DIGEST_B10L},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def test_trace_liga_os_quatro_elos_pelo_mesmo_par() -> None:
    """AT-036: request, advisory, decision e evento com correlation ID e tenant."""
    elos = elos_da_avaliacao(CORRELATION_ID, TENANT)
    assert [nome for nome, _corr, _ten in elos] == [
        "request",
        "advisory",
        "decision",
        "evento",
    ]
    assert all(corr == CORRELATION_ID and ten == TENANT for _n, corr, ten in elos)
    spans = construir_trace(CORRELATION_ID, TENANT, TRACE_ID)
    assert len(spans) == 4
    assert trace_completo(spans)


def test_trace_nao_junta_por_tempo_ou_texto_livre() -> None:
    """AT-036 negativo: IDs distintos nao se juntam; texto nao e chave."""
    spans = construir_trace(CORRELATION_ID, TENANT, TRACE_ID)
    outros = construir_trace("corr-outro-trabalho", TENANT, "trace-outro")
    misturados = (spans[0], spans[1], outros[2], outros[3])
    assert not trace_completo(misturados)
    incompletos = spans[:3]
    assert not trace_completo(incompletos)


def test_sli_e_budget_derivam_de_amostras_persistidas() -> None:
    """AT-044: SLI e fracao de boas; budget restante segue a formula do bloco."""
    amostras = gerar_amostras(SEED, N_BOAS_EXEMPLO, N_RUINS_EXEMPLO)
    assert amostras == AMOSTRAS_B10L
    observado = sli(amostras)
    assert observado == N_BOAS_EXEMPLO / (N_BOAS_EXEMPLO + N_RUINS_EXEMPLO)
    restante = budget_restante(observado, POLITICA_B10L.alvo)
    permitido = 1.0 - POLITICA_B10L.alvo
    assert restante == ((permitido - (1.0 - observado)) / permitido)
    assert 0.0 < restante < 1.0
    assert decidir(POLITICA_B10L, amostras) == DECISAO_LIBERAR


def test_budget_esgotado_contem_e_saudavel_libera() -> None:
    """AT-044: budget zerado exige conter/reverter; saudavel libera entrega."""
    saudaveis = tuple([True] * 19 + [False])
    assert decidir(POLITICA_B10L, saudaveis) == DECISAO_LIBERAR
    degradadas = tuple([True] * 10 + [False] * 10)
    assert decidir(POLITICA_B10L, degradadas) == DECISAO_CONTER


def test_slo_sem_dono_janela_fonte_ou_amostra_e_decorativo() -> None:
    """AT-044 negativo: sem dono/janela/fonte ou sem amostra nao ha decisao."""
    sem_owner = PoliticaSLO(
        alvo=0.9,
        janela=POLITICA_B10L.janela,
        fonte=POLITICA_B10L.fonte,
        owner="",
        consequencia_budget_esgotado=POLITICA_B10L.consequencia_budget_esgotado,
    )
    with pytest.raises(ValueError):
        decidir(sem_owner, AMOSTRAS_B10L)
    with pytest.raises(ValueError):
        sli(())


def test_runbook_overload_contem_e_drena() -> None:
    """AT-045 overload: shed explicito; fila drena sem crescimento ilimitado."""
    resultado = exercitar_overload(capacidade=2, ofertas=5)
    assert resultado.incidente == "overload"
    assert resultado.sem_parcial
    assert "drena" in resultado.criterio_saida


def test_runbook_db_locked_retry_limitado_ou_degrada() -> None:
    """AT-045 DB locked: retry dentro do orcamento grava; sem orcamento degrada."""
    recuperado = exercitar_db_locked(falhas_injetadas=2, orcamento_retry=3)
    assert recuperado.sem_parcial
    assert "nenhuma-avaliacao-parcial:ok" in recuperado.criterio_saida
    degradado = exercitar_db_locked(falhas_injetadas=5, orcamento_retry=3)
    assert degradado.sem_parcial
    assert "degradacao-declarada" in degradado.criterio_saida


def test_runbook_provider_com_fallback_auditado_sem_orfa() -> None:
    """AT-045 provider: timeout com cleanup; advisory ausente nao vira aceite."""
    resultado = exercitar_provider_indisponivel(prazo_ticks=5)
    assert resultado.sem_parcial
    assert "fallback-declarado" in resultado.acao
    assert "nao-vira-aceite" in resultado.criterio_saida


def test_runbook_rollback_restaura_v1_com_evidencia() -> None:
    """AT-045 rollback: v2 defeituosa desativa; v1 reproduzida no corpus."""
    v1 = ("reject", "review", "accept")
    v2 = ("accept", "review", "accept")
    resultado = exercitar_rollback(v1, v2)
    assert resultado.sem_parcial
    assert "desativar-v2-defeituosa" in resultado.acao
    assert "v1-restaurada" in resultado.criterio_saida


def test_postmortem_tem_acao_dono_prazo_sem_culpa() -> None:
    """AT-045: postmortem pergunta por condicao e barreira; termina em acao."""
    relato = Postmortem(
        incidente="overload",
        condicao_que_permitiu="admissao sem teto no caminho rapido",
        barreira_que_faltou="shed declarado com profundidade no teto",
        acao="fixar capacidade e registrar decisao de shed",
        dono="policy-owner",
        prazo="proxima-janela-exemplo",
    )
    assert relato.dono and relato.prazo and relato.acao
    assert "culpa" not in relato.condicao_que_permitiu


def test_ids_fora_de_metrica_guarda() -> None:
    """AT-033 (guarda): correlation ID, tenant e texto nao viram metrica."""
    proibidas = (
        SerieMetrica(nome=f"triagem_{CORRELATION_ID}_total", labels={}),
        SerieMetrica(nome="triagem_total", labels={"tenant": TENANT}),
        SerieMetrica(nome="triagem_total", labels={"texto": "pedido livre"}),
    )
    for serie in proibidas:
        veredito = varrer_metrica(serie, (CORRELATION_ID, TENANT, "pedido livre"))
        assert isinstance(veredito, NegacaoMetrica)
        assert veredito.motivo == "identificador-em-metrica"
    liberada = varrer_metrica(
        SerieMetrica(nome="triagem_total", labels=rotular_para_metrica("reject", "p0-proibido")),
        (CORRELATION_ID, TENANT, "pedido livre"),
    )
    assert isinstance(liberada, SerieMetrica)


def test_canario_fora_de_metrica_span_log_e_erro() -> None:
    """AT-033/032: canario e texto livre moram no log redigido, nunca na metrica."""
    detalhe = redigir(f"decisao com {CANARIO} e texto livre", (CANARIO,))
    assert CANARIO not in detalhe
    campo = campo_para_log(CORRELATION_ID, TENANT, detalhe)
    assert campo["correlation_id"] == CORRELATION_ID
    spans = construir_trace(CORRELATION_ID, TENANT, TRACE_ID)
    assert all(CANARIO not in span.trace_id for span in spans)
    veredito = varrer_metrica(
        SerieMetrica(nome="triagem_total", labels={"motivo": "p0-proibido"}),
        (CANARIO, CORRELATION_ID, TENANT),
    )
    assert isinstance(veredito, SerieMetrica)


def test_seed_reproduz_amostra_e_digest() -> None:
    """Evidencia: mesma seed reproduz amostra bruta, digest e canario."""
    assert gerar_amostras(SEED, N_BOAS_EXEMPLO, N_RUINS_EXEMPLO) == AMOSTRAS_B10L
    assert digest_amostras(SEED, AMOSTRAS_B10L) == DIGEST_B10L
    assert len(DIGEST_B10L) == 64
    assert CANARIO.startswith("canary-")
    assert len(_digest_evidencia()) == 64
