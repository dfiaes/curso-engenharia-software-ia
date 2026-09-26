"""Oráculos B09-L: injeção inerte, canário fora do rastro, IDs fora de métrica."""

from __future__ import annotations

import hashlib
import random
from collections.abc import Iterator

import pytest
from work_intake.domain.ameacas import (
    ABUSE_CASES,
    ATIVOS,
    ATORES,
    CORPUS_INJECAO,
    FRONTEIRAS,
    SEED_B09L,
    ContextoConfiavel,
    Encaminhar,
    ErroInterno,
    Metrica,
    Negacao,
    Pedido,
    RascunhoDecisao,
    RegistroTenant,
    aplicar_precedencia,
    autorizar_no_dominio,
    eh_injecao_conhecida,
    emitir_rastro,
    escrever_como,
    incorporar_conteudo_externo,
    ler_como,
    limpar_rastros,
    rastros_emitidos,
    redigir,
    reter,
    validar_metrica,
)

SEED = SEED_B09L
CANARIO = f"canary-{random.Random(SEED).getrandbits(64):016x}"
CORRELATION_ID = f"corr-{random.Random(SEED + 1).getrandbits(32):08x}"


@pytest.fixture
def contexto() -> ContextoConfiavel:
    return ContextoConfiavel(
        tenants_validos=frozenset({"tenant-acme", "tenant-vizinho"}),
        permissoes={"analista": frozenset({"ler", "escrever"})},
    )


@pytest.fixture(autouse=True)
def rastros_limpos() -> Iterator[None]:
    limpar_rastros()
    yield
    limpar_rastros()


def _digest_corpus() -> str:
    material = f"{SEED}:{'\n'.join(CORPUS_INJECAO)}:{CANARIO}".encode()
    return hashlib.sha256(material).hexdigest()


def test_threat_model_declara_fronteira_ativo_ator_e_abuse() -> None:
    """ES26-033: threat model declara os quatro elementos antes do controle."""
    assert FRONTEIRAS and ATIVOS and ATORES and ABUSE_CASES
    assert all(fronteira.falha for fronteira in FRONTEIRAS)
    assert all(ativo.oraculo for ativo in ATIVOS)


def test_injecao_permanece_dado_inerte() -> None:
    """AT-025: cada texto do corpus vira citação; veredito não muda."""
    assert len(CORPUS_INJECAO) == 5
    for texto in CORPUS_INJECAO:
        assert eh_injecao_conhecida(texto)
        decisao = RascunhoDecisao(veredito="reject")
        saida = incorporar_conteudo_externo(decisao, texto, segredos=(CANARIO,))
        assert saida.veredito == "reject"
        assert saida.citacoes == [f"[citacao-dado] {texto}"]


def test_proibicao_deterministica_sobrevive_a_advisory_hostil() -> None:
    """AT-025: precedência fixa; conteúdo confiante não revoga proibição."""
    assert aplicar_precedencia(True, "accept") == "reject"
    assert aplicar_precedencia(False, "accept") == "accept"
    hostil = CORPUS_INJECAO[1]
    decisao = RascunhoDecisao(veredito=aplicar_precedencia(True, "accept"))
    incorporar_conteudo_externo(decisao, hostil)
    assert decisao.veredito == "reject"


def test_canario_some_de_log_e_trace() -> None:
    """AT-032: segredo canário injetado não aparece em nenhum rastro emitido."""
    emitir_rastro(f"evento normal com {CANARIO} embutido", lambda e: redigir(e, (CANARIO,)))
    emitir_rastro(f"trace de erro com {CANARIO} no caminho feliz", lambda e: redigir(e, (CANARIO,)))
    rastros = rastros_emitidos()
    assert len(rastros) == 2
    assert all(CANARIO not in rastro for rastro in rastros)
    assert all("[redigido]" in rastro for rastro in rastros)


def test_erro_verboso_tambem_passar_por_redacao() -> None:
    """AT-032: redação antes do handler cobre o caminho de erro, não só o feliz."""
    causa = f"falha em /srv/interno/db com {CANARIO}"
    emitir_rastro(f"ERRO {causa}", lambda e: redigir(e, (CANARIO,)))
    (rastro,) = rastros_emitidos()
    assert CANARIO not in rastro
    assert "/srv/interno/db" in rastro


def test_ids_fora_de_metrica() -> None:
    """AT-033: correlation ID, tenant e texto não viram nome ou label de métrica."""
    proibidas = (
        Metrica(nome=f"triagem_{CORRELATION_ID}_total", labels={}),
        Metrica(nome="triagem_total", labels={"tenant": "tenant-acme"}),
        Metrica(nome="triagem_total", labels={"texto": "pedido livre"}),
    )
    for metrica in proibidas:
        veredito = validar_metrica(metrica, (CORRELATION_ID, "tenant-acme", "pedido livre"))
        assert isinstance(veredito, Negacao)
        assert veredito.motivo == "identificador-em-metrica"
    liberada = validar_metrica(
        Metrica(nome="triagem_total", labels={"outcome": "reject"}),
        (CORRELATION_ID, "tenant-acme", "pedido livre"),
    )
    assert isinstance(liberada, Metrica)


def test_erro_causa_dentro_motivo_seguro_fora() -> None:
    """AT-034: causa preservada para operação; fora só o motivo seguro."""
    erro = ErroInterno(
        causa="stack em /srv/interno/policy.py:42 com tenant-acme",
        motivo_seguro="rejeitado-pela-politica",
    )
    assert "srv/interno" in erro.para_operacao()
    assert erro.para_externo() == "rejeitado-pela-politica"
    assert "srv/interno" not in erro.para_externo()
    assert "tenant-acme" not in erro.para_externo()


def test_tenant_cruzado_negado_na_leitura_e_na_escrita(
    contexto: ContextoConfiavel,
) -> None:
    """AT-035: leitura e escrita cruzadas negadas com motivo explícito."""
    registro = RegistroTenant(tenant="tenant-acme", dado="dado", criado_em=0, prazo=30)
    pedido_outro = Pedido(tenant="tenant-vizinho", ator="analista", acao="ler")
    leitura = ler_como(registro, pedido_outro, contexto)
    assert isinstance(leitura, Negacao)
    escrita = escrever_como("tenant-acme", "dado", pedido_outro, contexto)
    assert isinstance(escrita, Negacao)
    assert escrita.motivo == "tenant-cruzado-negado"
    pedido_proprio = Pedido(tenant="tenant-acme", ator="analista", acao="ler")
    assert isinstance(autorizar_no_dominio(pedido_proprio, contexto), Encaminhar)
    assert ler_como(registro, pedido_proprio, contexto) == "dado"


def test_retencao_descarta_apos_prazo() -> None:
    """AT-035: dado além do prazo é descartado; dentro do prazo permanece."""
    registros = (
        RegistroTenant(tenant="t", dado="expirado", criado_em=0, prazo=30),
        RegistroTenant(tenant="t", dado="vigente", criado_em=20, prazo=30),
    )
    retidos = reter(registros, agora=31)
    assert [r.dado for r in retidos] == ["vigente"]
    assert reter(registros, agora=10) == registros


def test_fail_closed_na_duvida_nunca_libera(contexto: ContextoConfiavel) -> None:
    """ES26-034: tenant ambíguo, integridade duvidosa ou sem privilégio nega."""
    duvidas = (
        Pedido(tenant="", ator="analista", acao="ler"),
        Pedido(tenant="tenant-acme", ator="analista", acao="ler", integridade_ok=False),
        Pedido(tenant="tenant-acme", ator="desconhecido", acao="ler"),
        Pedido(tenant="tenant-acme", ator="analista", acao="publicar"),
    )
    vereditos = [autorizar_no_dominio(pedido, contexto) for pedido in duvidas]
    assert all(isinstance(veredito, Negacao) for veredito in vereditos)
    motivos = [v.motivo for v in vereditos if isinstance(v, Negacao)]
    assert motivos == [
        "tenant-desconhecido",
        "integridade-duvidosa",
        "sem-privilegio",
        "sem-privilegio",
    ]


def test_seed_fixa_reproduz_corpus_e_digest() -> None:
    """Mesma seed reproduz canário, corpus e digest; números são exemplo variável."""
    assert random.Random(SEED).getrandbits(64) == random.Random(SEED).getrandbits(64)
    assert CANARIO.startswith("canary-")
    assert _digest_corpus() == _digest_corpus()
    assert len(_digest_corpus()) == 64
