"""B18: PRR exige manifesto revisado e artefatos íntegros; NO-GO é explícito."""

import copy
import hashlib
import json
from collections.abc import Callable
from dataclasses import FrozenInstanceError
from pathlib import Path
from typing import cast

import pytest

from capstone_lab.prr import (
    GAMEDAY_PAPEIS,
    PRR_CHECKLIST,
    GameDay,
    decide_go_no_go,
    game_day_release_ruim,
    prr_report,
)

REVISION_DIGEST = "a" * 64


def escrever_manifesto(root: Path) -> tuple[Path, dict[str, object]]:
    itens: dict[str, object] = {}
    for requisito in PRR_CHECKLIST:
        caminho = Path("evidence/m13/prr") / f"{requisito.area}.txt"
        arquivo = root / caminho
        arquivo.parent.mkdir(parents=True, exist_ok=True)
        conteudo = f"evidência fixture: {requisito.area}\n".encode()
        arquivo.write_bytes(conteudo)
        itens[requisito.area] = {
            "requirement": requisito.pergunta,
            "status": "PASS",
            "artifact_path": caminho.as_posix(),
            "artifact_sha256": hashlib.sha256(conteudo).hexdigest(),
            "command": "fixture validada pelo teste",
            "cwd": ".",
            "returncode": 0,
            "result": f"artefato de teste para {requisito.area}",
            "reviewer": "fixture-reviewer",
            "reviewed_revision_digest": REVISION_DIGEST,
            "environment": "fixture local de pytest",
            "scenario": "controle positivo determinístico",
            "scope": "teste unitário do contrato do manifesto",
            "limitations": ["não é evidência de release real"],
        }
    manifesto: dict[str, object] = {
        "schema_version": 1,
        "revision_digest": REVISION_DIGEST,
        "items": itens,
    }
    caminho_manifesto = root / "evidence/m13/prr-manifest.json"
    caminho_manifesto.parent.mkdir(parents=True, exist_ok=True)
    caminho_manifesto.write_text(json.dumps(manifesto), encoding="utf-8")
    return caminho_manifesto, manifesto


def manifest_items(manifesto: dict[str, object]) -> dict[str, dict[str, object]]:
    return cast(dict[str, dict[str, object]], manifesto["items"])


def game_day_completo() -> GameDay:
    return game_day_release_ruim()


def callback_recuperacao_falsa() -> tuple[bool, bool, bool]:
    return (True, False, False)


def callback_que_falha() -> tuple[bool, bool, bool]:
    raise RuntimeError("callback externo não é execução do game day")


def test_checklist_cobre_as_dez_areas_exigidas() -> None:
    assert len(PRR_CHECKLIST) == 10
    assert len({item.area for item in PRR_CHECKLIST}) == 10
    assert all(item.evidencia.startswith("evidence/m13/") for item in PRR_CHECKLIST)


def test_diretorios_vazios_nao_aprovam_prr(tmp_path: Path) -> None:
    for item in PRR_CHECKLIST:
        (tmp_path / item.evidencia).mkdir(parents=True, exist_ok=True)

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    decisao = decide_go_no_go(relatorio, game_day_completo())

    assert relatorio["aprovados"] == 0
    assert relatorio["pendentes"] == 10
    assert decisao["veredito"] == "NO-GO"
    assert all("manifesto indisponível" in item["motivo"] for item in relatorio["itens"])


def test_manifesto_e_artefatos_validos_aprovam_fixture(tmp_path: Path) -> None:
    escrever_manifesto(tmp_path)

    relatorio = prr_report(tmp_path, REVISION_DIGEST)

    assert relatorio["aprovados"] == 10
    assert relatorio["pendentes"] == 0
    assert relatorio["go"] is True
    assert decide_go_no_go(relatorio, game_day_completo())["veredito"] == "GO"


def test_gameday_manual_com_eventos_nao_comprova_execucao(tmp_path: Path) -> None:
    escrever_manifesto(tmp_path)
    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    game_day = GameDay("eventos-sem-execucao")
    for minuto in range(5):
        game_day.registrar(minuto, "escriba", "evento afirmado sem callback")

    assert game_day.recovery_observed is False

    decisao = decide_go_no_go(relatorio, game_day)

    assert decisao["veredito"] == "NO-GO"
    assert any("não comprovou" in motivo for motivo in decisao["motivos"])


@pytest.mark.parametrize("callback", [callback_recuperacao_falsa, callback_que_falha])
def test_game_day_nao_aceita_callback_como_prova_de_recuperacao(
    callback: Callable[[], tuple[bool, bool, bool]],
) -> None:
    with pytest.raises(TypeError, match="unexpected keyword argument"):
        game_day_release_ruim(callback=callback)  # type: ignore[call-arg]


def test_recibo_de_execucao_nao_pode_ser_atribuido_apos_construcao() -> None:
    game_day = GameDay("sem-execucao")

    with pytest.raises(FrozenInstanceError):
        game_day._execution_result = (True, True, True)  # type: ignore[misc]

    assert game_day.recovery_observed is False


def test_timeline_de_execucao_concluida_nao_pode_ser_trocada_por_eventos_falsos() -> None:
    game_day = game_day_completo()
    eventos_observados = game_day.timeline

    with pytest.raises(AttributeError):
        game_day.timeline.append(eventos_observados[0])  # type: ignore[attr-defined]
    with pytest.raises(RuntimeError, match="timeline encerrada"):
        game_day.registrar(11, "escriba", "evento inventado")

    assert game_day.timeline == eventos_observados
    assert game_day.recovery_observed is True


@pytest.mark.parametrize("conteudo", ["", "{"])
def test_manifesto_vazio_ou_json_invalido_vira_no_go(tmp_path: Path, conteudo: str) -> None:
    caminho, _ = escrever_manifesto(tmp_path)
    caminho.write_text(conteudo, encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)

    assert relatorio["go"] is False
    assert relatorio["aprovados"] == 0
    assert all(
        "manifesto indisponível ou inválido" in item["motivo"] for item in relatorio["itens"]
    )


def test_requisito_ausente_nao_pode_ser_ignorado(tmp_path: Path) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    manifest_items(manifesto).pop("rollback")
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)

    assert relatorio["go"] is False
    assert all("exatamente as áreas" in item["motivo"] for item in relatorio["itens"])


@pytest.mark.parametrize("status", ["FAIL", "BLOCKED"])
def test_status_fail_ou_blocked_nunca_aprova_requisito(tmp_path: Path, status: str) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    itens = manifest_items(manifesto)
    itens["dados"]["status"] = status
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    dados = next(item for item in relatorio["itens"] if item["area"] == "dados")

    assert dados["ok"] is False
    assert f"marcado como {status}" in dados["motivo"]
    assert decide_go_no_go(relatorio, game_day_completo())["veredito"] == "NO-GO"


def test_revision_digest_de_outra_revisao_nao_aprova(tmp_path: Path) -> None:
    escrever_manifesto(tmp_path)

    relatorio = prr_report(tmp_path, "b" * 64)

    assert relatorio["go"] is False
    assert all("outro revision_digest" in item["motivo"] for item in relatorio["itens"])


def test_schema_version_booleano_nao_e_a_versao_inteira_um(tmp_path: Path) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    manifesto["schema_version"] = True
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)

    assert relatorio["go"] is False
    assert all(
        "schema_version do manifesto deve ser 1" in item["motivo"] for item in relatorio["itens"]
    )


def test_manifesto_symlink_para_fora_da_raiz_nao_aprova(
    tmp_path: Path, tmp_path_factory: pytest.TempPathFactory
) -> None:
    caminho, _ = escrever_manifesto(tmp_path)
    manifesto_externo = tmp_path_factory.mktemp("manifesto-externo") / "prr-manifest.json"
    manifesto_externo.write_bytes(caminho.read_bytes())
    caminho.unlink()
    caminho.symlink_to(manifesto_externo)

    relatorio = prr_report(tmp_path, REVISION_DIGEST)

    assert relatorio["go"] is False
    assert relatorio["aprovados"] == 0
    assert all(
        "manifesto resolve para fora da raiz" in item["motivo"] for item in relatorio["itens"]
    )


@pytest.mark.parametrize("local", ["raiz", "requisito"])
def test_campos_nao_permitidos_pelo_schema_nao_aprovam(tmp_path: Path, local: str) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    if local == "raiz":
        manifesto["extra"] = "ignorado pelo schema seria inválido"
    else:
        manifest_items(manifesto)["dados"]["extra"] = "ignorado pelo schema seria inválido"
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)

    assert relatorio["go"] is False
    if local == "raiz":
        assert relatorio["aprovados"] == 0
    else:
        dados = next(item for item in relatorio["itens"] if item["area"] == "dados")
        assert dados["ok"] is False


def test_revisao_de_um_requisito_de_outra_revisao_nao_aprova(tmp_path: Path) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    manifest_items(manifesto)["dados"]["reviewed_revision_digest"] = "b" * 64
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    dados = next(item for item in relatorio["itens"] if item["area"] == "dados")

    assert dados["ok"] is False
    assert "outro revision_digest" in dados["motivo"]


def test_hash_invalido_ou_divergente_nao_aprova(tmp_path: Path) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    itens = manifest_items(manifesto)
    itens["segurança"]["artifact_sha256"] = "0" * 64
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    seguranca = next(item for item in relatorio["itens"] if item["area"] == "segurança")

    assert seguranca["ok"] is False
    assert "não corresponde" in seguranca["motivo"]


def test_hash_malformado_nao_aprova(tmp_path: Path) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    manifest_items(manifesto)["dados"]["artifact_sha256"] = "not-a-sha256"
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    dados = next(item for item in relatorio["itens"] if item["area"] == "dados")

    assert dados["ok"] is False
    assert "64 caracteres hexadecimais" in dados["motivo"]


def test_caminho_que_escapa_da_raiz_nao_aprova(tmp_path: Path) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    itens = manifest_items(manifesto)
    itens["arquitetura"]["artifact_path"] = "../../outside.txt"
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    arquitetura = next(item for item in relatorio["itens"] if item["area"] == "arquitetura")

    assert arquitetura["ok"] is False
    assert "permanecer dentro" in arquitetura["motivo"]


def test_symlink_para_fora_da_raiz_nao_aprova(
    tmp_path: Path, tmp_path_factory: pytest.TempPathFactory
) -> None:
    caminho, manifesto = escrever_manifesto(tmp_path)
    fora = tmp_path_factory.mktemp("prr-outside") / "evidence.txt"
    fora.write_text("evidência externa", encoding="utf-8")
    caminho_escapado = tmp_path / "evidence/m13/prr/escape.txt"
    caminho_escapado.symlink_to(fora)
    manifest_items(manifesto)["arquitetura"]["artifact_path"] = "evidence/m13/prr/escape.txt"
    manifest_items(manifesto)["arquitetura"]["artifact_sha256"] = hashlib.sha256(
        fora.read_bytes()
    ).hexdigest()
    caminho.write_text(json.dumps(manifesto), encoding="utf-8")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    arquitetura = next(item for item in relatorio["itens"] if item["area"] == "arquitetura")

    assert arquitetura["ok"] is False
    assert "resolve para fora" in arquitetura["motivo"]


def test_arquivo_de_evidencia_vazio_nao_aprova(tmp_path: Path) -> None:
    _, manifesto = escrever_manifesto(tmp_path)
    itens = manifest_items(manifesto)
    caminho = tmp_path / str(itens["capacidade"]["artifact_path"])
    caminho.write_bytes(b"")

    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    capacidade = next(item for item in relatorio["itens"] if item["area"] == "capacidade")

    assert capacidade["ok"] is False
    assert "artefato vazio" in capacidade["motivo"]


def test_decisao_nao_aceita_prr_com_menos_que_dez_requisitos(tmp_path: Path) -> None:
    escrever_manifesto(tmp_path)
    relatorio = prr_report(tmp_path, REVISION_DIGEST)
    relatorio_incompleto = copy.deepcopy(relatorio)
    relatorio_incompleto["itens"] = relatorio_incompleto["itens"][:1]

    decisao = decide_go_no_go(relatorio_incompleto, game_day_completo())

    assert decisao["veredito"] == "NO-GO"
    assert "PRR incompleto" in decisao["motivos"][-1]


def test_timeline_rejeita_evento_fora_de_ordem() -> None:
    gd = GameDay("cenario-teste")
    gd.registrar(10, "escriba", "registro")
    with pytest.raises(ValueError, match="fora de ordem"):
        gd.registrar(5, "escriba", "impossível")


def test_game_day_registra_execucao_e_postmortem_derivado() -> None:
    gd = game_day_completo()
    assert len(gd.timeline) == 5
    papeis = {papel.nome for papel in GAMEDAY_PAPEIS}
    assert {evento.ator for evento in gd.timeline} <= papeis
    pm = gd.postmortem()
    assert pm["duracao_min"] == 10
    assert "t+5min" in str(pm["eventos"])
    assert "failure_injected" in gd.timeline[2].descricao
    assert gd.recovery_observed is True
