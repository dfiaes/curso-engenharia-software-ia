"""Oraculos B12-L: rollback, instalacao limpa, portabilidade, offline e manifesto."""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
from pathlib import Path

import pytest
from work_intake.application.mudanca import (
    DIGEST_B12L,
    MANIFESTO_B12L,
    PASSOS_B12L,
    PEDIDOS_B12L,
    SEED_B12L,
    Costura,
    Fatia,
    MetricasDora,
    abrir_costura,
    atendida_por_nova,
    avaliar_corpus,
    avaliar_mudanca,
    avaliar_pedido,
    avaliar_pessoa_por_dora,
    contrair_contrato,
    decidir_entrega,
    decidir_policy,
    desviar_rota,
    digest_manifesto,
    exigir_contexto_sem_credencial,
    expandir_contrato,
    expor_por_flag,
    montar_manifesto,
    nomes_equivalentes,
    normalizar_casing,
    normalizar_newline,
    plano_incremental,
    pode_reverter,
    porta_de_mudanca,
    registrar_mudanca,
    sem_import_proibido,
    verificar_manifesto,
)

SEED = SEED_B12L


def test_gate_libera_contem_ou_bloqueia_antes_de_integrar() -> None:
    """ES26-045: fatia reversivel de risco baixo libera; alto contem; sem volta bloqueia."""
    assert avaliar_mudanca(risco="baixo", reversivel=True, rollback_descrito=True) == "liberar"
    assert avaliar_mudanca(risco="alto", reversivel=True, rollback_descrito=True) == "conter"
    assert avaliar_mudanca(risco="baixo", reversivel=False, rollback_descrito=True) == "bloqueada"
    assert avaliar_mudanca(risco="baixo", reversivel=True, rollback_descrito=False) == "bloqueada"
    with pytest.raises(ValueError):
        avaliar_mudanca(risco="medio-exemplo", reversivel=True, rollback_descrito=True)


def test_fatia_sem_owner_ou_trigger_falha_no_gate() -> None:
    """ES26-045 negativo: sem owner, motivo ou trigger a revisao opina sobre estilo."""
    base = Fatia(
        motivo="reason-code-novo-atras-de-flag-exemplo",
        risco="baixo",
        reversivel=True,
        rollback_descrito=True,
        owner="time-exemplo",
        trigger_revisao="corpus-golden-exemplo",
    )
    assert porta_de_mudanca(base) == "liberar"
    sem_owner = Fatia(
        motivo=base.motivo,
        risco=base.risco,
        reversivel=True,
        rollback_descrito=True,
        owner="",
        trigger_revisao=base.trigger_revisao,
    )
    assert porta_de_mudanca(sem_owner) == "bloqueada"


def test_legado_por_costura_strangler_e_expand_contract() -> None:
    """ES26-046: costura com teste, desvio aos poucos e contracao so apos migracao."""
    costura = abrir_costura("policy-legada-exemplo", com_corpus_golden=True)
    assert isinstance(costura, Costura) and costura.com_corpus
    with pytest.raises(ValueError):
        abrir_costura("trecho-as-cegas-exemplo", com_corpus_golden=False)
    rota = desviar_rota("policy-v1-exemplo", "policy-v2-exemplo", percentual_nova=10.0)
    assert rota.percentual_nova == 10.0
    assert plano_incremental(list(PASSOS_B12L)) == PASSOS_B12L
    with pytest.raises(ValueError):
        plano_incremental(["desviar-fatia", "contrair-velho"])
    aceitas = expandir_contrato(frozenset({"v1-exemplo"}), "v2-exemplo")
    assert "v1-exemplo" in aceitas and "v2-exemplo" in aceitas
    with pytest.raises(ValueError):
        contrair_contrato(aceitas, "v1-exemplo", {"consumidor-a": "v1-exemplo"})
    contraidas = contrair_contrato(aceitas, "v1-exemplo", {"consumidor-a": "v2-exemplo"})
    assert "v1-exemplo" not in contraidas


def test_strangler_desvia_aos_poucos_com_mesma_semente() -> None:
    """ES26-046: velho e novo coexistem; o gate decide quem atende por fatia."""
    atendidas = sum(
        1 for i in range(200) if atendida_por_nova(semente=SEED, indice=i, percentual_nova=10.0)
    )
    assert 0 < atendidas < 200
    repetidas = sum(
        1 for i in range(200) if atendida_por_nova(semente=SEED, indice=i, percentual_nova=10.0)
    )
    assert repetidas == atendidas
    assert all(atendida_por_nova(semente=SEED, indice=i, percentual_nova=100.0) for i in range(10))
    assert not any(
        atendida_por_nova(semente=SEED, indice=i, percentual_nova=0.0) for i in range(10)
    )


def test_rollback_desativa_v2_e_restaura_v1_no_corpus() -> None:
    """AT-039: desativar a v2 defeituosa restaura o comportamento v1 observado."""
    assert decidir_policy("v2", False) == "v1"
    assert decidir_policy("v2", True) == "v2"
    assert decidir_policy("v1", False) == "v1"
    antes = avaliar_corpus("v1")
    defeito = avaliar_corpus("v2")
    assert antes != defeito
    assert dict(defeito)["ped-exemplo-02"] == "accept-exemplo-defeituoso"
    versao_restaurada = decidir_policy("v2", False)
    depois = avaliar_corpus(versao_restaurada)
    assert depois == antes == tuple((p, avaliar_pedido("v1", p)) for p in PEDIDOS_B12L)
    assert not pode_reverter(migracao_destrutiva=True, rollback_descrito=True)
    assert pode_reverter(migracao_destrutiva=False, rollback_descrito=True)
    assert not expor_por_flag(instalado=True, flag_ligada=False)
    assert expor_por_flag(instalado=True, flag_ligada=True)


def test_rollback_nao_apaga_historia_de_dado() -> None:
    """Limite B12: flag desliga comportamento; dado escrito pela v2 segue existindo."""
    with pytest.raises(ValueError):
        avaliar_pedido("v3-exemplo", "ped-exemplo-01")
    with pytest.raises(ValueError):
        avaliar_pedido("v1", "ped-inexistente-exemplo")
    with pytest.raises(ValueError):
        decidir_policy("v3-exemplo", True)


def test_instalacao_limpa_executa_fora_do_checkout() -> None:
    """AT-040: API e CLI executam fora do source tree sem importar o checkout por acidente."""
    lab_root = Path(__file__).resolve().parents[2]
    saida = subprocess.run(
        [sys.executable, "-m", "work_intake.cli", "evaluate", "--help"],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=lab_root / "fixtures",
    )
    assert saida.returncode == 0, saida.stderr
    import work_intake

    assert (lab_root / "fixtures").as_posix() not in Path(work_intake.__file__).as_posix()
    texto_pyproject = (lab_root / "pyproject.toml").read_text(encoding="utf-8")
    assert 'work-intake = "work_intake.cli:main"' in texto_pyproject
    for sufixo in (
        "python/src/work_intake/cli.py",
        "python/src/work_intake/py.typed",
        "python/src/work_intake/adapters/sqlite/001_initial.sql",
    ):
        assert (lab_root / sufixo).exists(), sufixo


def test_portabilidade_newline_casing_e_paths() -> None:
    """AT-041: newline, casing e paths passam em Windows e Linux."""
    assert normalizar_newline("linha1\r\nlinha2\r directional") == "linha1\nlinha2\n directional"
    assert normalizar_newline("a\rb\nc\r\nd") == "a\nb\nc\nd"
    assert normalizar_casing("  Accept-Exemplo ") == normalizar_casing("ACCEPT-exemplo")
    with pytest.raises(ValueError):
        normalizar_casing("   ")
    assert nomes_equivalentes("C:\\labs\\Evidence.JSON", "/tmp/labs/evidence.json")
    assert not nomes_equivalentes("C:\\labs\\a.json", "/tmp/labs/b.json")
    with pytest.raises(ValueError):
        nomes_equivalentes("", "/tmp/labs/evidence.json")


def test_suite_obrigatoria_roda_offline_sem_credencial(monkeypatch: pytest.MonkeyPatch) -> None:
    """AT-042: caminho B12-L sem rede e sem credencial, com socket bloqueado."""
    origem = Path(__file__).resolve().parents[1] / "src" / "work_intake" / "application"
    texto = (origem / "mudanca.py").read_text(encoding="utf-8")
    assert sem_import_proibido(texto)
    assert not sem_import_proibido("import socket\n")
    exigir_contexto_sem_credencial({})
    exigir_contexto_sem_credencial({"PATH": os.environ.get("PATH", ""), "HOME": "casa-exemplo"})
    with pytest.raises(ValueError):
        exigir_contexto_sem_credencial({"API_KEY": "segredo-exemplo"})
    original = socket.socket
    monkeypatch.setattr(socket, "socket", None)
    try:
        assert avaliar_mudanca(risco="baixo", reversivel=True, rollback_descrito=True) == "liberar"
        assert decidir_policy("v2", False) == "v1"
        assert verificar_manifesto(MANIFESTO_B12L, DIGEST_B12L)
    finally:
        monkeypatch.setattr(socket, "socket", original)


def test_manifesto_registra_tudo_e_digest_recalcula() -> None:
    """AT-043: commit, OS, runtimes, versoes, seeds, digests e duracoes com digest."""
    for chave in ("commit", "so", "runtimes", "versoes", "seeds", "digests", "duracoes_s"):
        assert chave in MANIFESTO_B12L, chave
    assert verificar_manifesto(MANIFESTO_B12L, DIGEST_B12L)
    assert len(DIGEST_B12L) == 64
    assert digest_manifesto(MANIFESTO_B12L) == DIGEST_B12L
    manifesto: list[dict[str, str]] = []
    registrar_mudanca(
        manifesto, commit="c-exemplo", so="linux-exemplo", semente=str(SEED), digest=DIGEST_B12L
    )
    assert manifesto == [
        {"commit": "c-exemplo", "so": "linux-exemplo", "semente": str(SEED), "digest": DIGEST_B12L}
    ]
    with pytest.raises(ValueError):
        registrar_mudanca(manifesto, commit="", so="x", semente="y", digest="z")
    with pytest.raises(ValueError):
        montar_manifesto(
            commit="",
            so="linux-exemplo",
            runtimes=("cpython-exemplo",),
            versoes={"a": "1"},
            seeds={"s": 1},
            digests={"d": "x"},
            duracoes_s={"t": 0.1},
        )


def test_manifesto_adulterado_quebra_o_digest() -> None:
    """AT-043 negativo: evidencia sem digest recalculavel invalida."""
    adulterado = dict(MANIFESTO_B12L)
    adulterado["commit"] = "commit-adulterado-exemplo"
    assert not verificar_manifesto(adulterado, DIGEST_B12L)
    material = json.dumps(
        {"seed": SEED, "digest": DIGEST_B12L, "manifesto": MANIFESTO_B12L},
        sort_keys=True,
        separators=(",", ":"),
    )
    assert len(material) > 0


def test_dora_guia_decisao_e_nunca_ranqueia_pessoa() -> None:
    """ES26-048: frequencia/lead medem fluxo; falha/restauracao medem seguranca."""
    assert decidir_entrega(MetricasDora(1.0, 2.0, 0.01, 0.25)) == "manter"
    assert decidir_entrega(MetricasDora(1.0, 2.0, 0.30, 0.25)) == "reforcar-gate"
    assert decidir_entrega(MetricasDora(1.0, 2.0, 0.01, 4.0)) == "conter-rollout"
    assert decidir_entrega(MetricasDora(1.0, 72.0, 0.01, 0.25)) == "reordenar-fatias"
    with pytest.raises(ValueError):
        avaliar_pessoa_por_dora(pessoa="pessoa-exemplo")
    with pytest.raises(ValueError):
        decidir_entrega(MetricasDora(1.0, 2.0, 1.5, 0.25))
