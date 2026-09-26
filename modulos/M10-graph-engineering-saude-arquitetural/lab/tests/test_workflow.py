"""Workflow: checkpoint, resume, HITL e reducers (AT-002..006)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from graph_lab.workflow import Pausa, Workflow

THREAD = "ingestao-1-1"


def _base(arquivo: Path) -> Workflow:
    wf = Workflow(arquivo=arquivo, inicio="a")
    wf.add_no("a", lambda s: {"x": 1})
    wf.add_no("b", lambda s: {"y": s["x"] + 1})
    wf.add_aresta("a", "b")
    return wf


def test_executa_e_persiste_por_passo(tmp_path: Path) -> None:
    wf = _base(tmp_path / "cp.jsonl")
    assert wf.run(THREAD, {}) == {"x": 1, "y": 2}
    assert len((tmp_path / "cp.jsonl").read_text().splitlines()) == 2


def test_thread_desconhecida_nao_herda_estado() -> None:
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        arquivo = Path(tmp) / "cp.jsonl"
        wf = _base(arquivo)
        wf.run(THREAD, {"marca": "t1"})
        outro = wf.continuar_de("outra-thread", {"marca": "t2"})
        assert outro["marca"] == "t2"  # recomeça do início, sem herdar


def test_kill_e_continuar_sem_repetir_efeito(tmp_path: Path) -> None:
    efeitos = tmp_path / "efeitos.txt"
    arquivo = tmp_path / "cp.jsonl"

    def pago(_estado: dict[str, Any]) -> dict[str, Any]:
        if efeitos.exists():
            return {"pago": True}  # idempotente: guarda "já fiz?"
        efeitos.write_text("x")
        raise RuntimeError("kill simulado")

    def montar() -> Workflow:
        wf = Workflow(arquivo=arquivo, inicio="a")
        wf.add_no("a", pago)
        wf.add_no("b", lambda s: {"fim": True})
        wf.add_aresta("a", "b")
        return wf

    try:
        montar().run(THREAD, {})
    except RuntimeError:
        pass
    else:
        raise AssertionError("deveria morrer")
    assert montar().continuar_de(THREAD, {})["fim"] is True
    assert efeitos.read_text() == "x"  # efeito uma vez, não duas


def test_fanout_com_add_soma_sem_add_perde(tmp_path: Path) -> None:
    def montar(nome: str, reducer: str | None) -> Workflow:
        wf = Workflow(arquivo=tmp_path / f"cp-{nome}.jsonl")
        wf.add_no(
            "juncao",
            lambda s: {"__fanout__": [{"itens": ["a1"]}, {"itens": ["b1"]}]},
        )
        wf.add_no("fim", lambda s: {"pronto": True})
        wf.add_aresta("juncao", "fim")
        wf.inicio = "juncao"
        if reducer == "add":
            wf.set_reducer("itens", "add")
        return wf

    assert montar("com", "add").run("t1", {"itens": []})["itens"] == ["a1", "b1"]
    assert montar("sem", None).run("t2", {"itens": []})["itens"] == ["b1"]


def test_hitl_pausa_e_retoma_em_outra_instancia(tmp_path: Path) -> None:
    arquivo = tmp_path / "cp.jsonl"

    def revisao(estado: dict[str, Any]) -> Any:
        if "__retomada__" not in estado:
            return Pausa({"tipo": "revisao", "itens": 2})
        return {"aprovado": estado["__retomada__"]}

    def montar() -> Workflow:
        wf = Workflow(arquivo=arquivo, inicio="rev")
        wf.add_no("rev", revisao)
        return wf

    saida = montar().run(THREAD, {})
    assert saida["__pausado__"]["tipo"] == "revisao"
    final = montar().resume(THREAD, {"ok": True})
    assert final["aprovado"] == {"ok": True}
