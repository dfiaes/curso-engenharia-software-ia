from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

EVALS = Path(__file__).resolve().parents[1] / "template" / "evals"
sys.path.insert(0, str(EVALS))

import run_evals as ev  # noqa: E402

EXEMPLOS = EVALS / "exemplos"


def reg(caso: str, variante: str, tentativa: int, ok: bool, custo: float | None = 0.01, **kw):  # type: ignore[no-untyped-def]
    base = {"caso": caso, "variante": variante, "modelo": "m", "tentativa": tentativa, "sucesso": ok,
            "motivo": "" if ok else "verificar.comando (exit 1)", "latencia_s": 1.0, "tokens_entrada": 1,
            "tokens_saida": 1, "custo": custo, "acionou_skill": None, "deve_acionar_skill": None}
    base.update(kw)
    return base


def test_pass_k_pass_at_k_e_custo_por_sucesso() -> None:
    regs = [
        reg("c1", "A", 1, True, 0.10), reg("c1", "A", 2, True, 0.10),   # sempre ok
        reg("c2", "A", 1, True, 0.10), reg("c2", "A", 2, False, 0.10),  # intermitente
        reg("c3", "A", 1, False, 0.10), reg("c3", "A", 2, False, 0.10), # nunca
    ]
    m = ev.pass_metricas(ev.por_caso(regs, "A"))
    assert m["pass1"] == pytest.approx((1 + 0.5 + 0) / 3)
    assert m["pass_k"] == pytest.approx(1 / 3)
    assert m["pass_at_k"] == pytest.approx(2 / 3)
    s = ev.resumo_variante(regs, "A")
    assert s["custo_total"] == pytest.approx(0.60)
    assert s["custo_por_sucesso"] == pytest.approx(0.60 / 3)
    assert s["falhas"] == {"verificar.comando": 3}


def test_custo_nd_quando_sem_tokens() -> None:
    regs = [reg("c1", "A", 1, True, None), reg("c1", "A", 2, True, None)]
    s = ev.resumo_variante(regs, "A")
    assert s["custo_total"] is None and s["custo_por_sucesso"] is None
    assert "n/d" in ev.gerar_relatorio(regs, ["A"], {}, 0.05)


def test_percentis() -> None:
    assert ev.percentil([1, 2, 3, 4, 5], 50) == 3
    assert ev.percentil([1, 2, 3, 4, 5], 95) == pytest.approx(4.8)
    assert ev.percentil([], 50) is None


def test_mcnemar_exato() -> None:
    assert ev.mcnemar_exato(0, 0) == 1.0
    assert ev.mcnemar_exato(5, 5) == 1.0
    assert ev.mcnemar_exato(2, 0) == pytest.approx(0.5)
    assert ev.mcnemar_exato(10, 0) == pytest.approx(2 / 1024)
    assert ev.mcnemar_exato(8, 2) == pytest.approx(0.109375)


def test_comparacao_recomendacao_e_ruido() -> None:
    regs = []
    for i in range(10):
        regs += [reg(f"c{i}", "A", 1, True, 0.10), reg(f"c{i}", "B", 1, i != 0, 0.01)]
    c = ev.comparar(regs, "A", "B", tolerancia=0.15)
    assert c["mudaram"] == [("c0", "ok", "falha")]
    assert "não distinguível de ruído com 10 casos" in c["frase"]
    assert c["recomendacao"].startswith("TROCAR A por B")
    c2 = ev.comparar(regs, "A", "B", tolerancia=0.05)
    assert c2["recomendacao"].startswith("MANTER A")


def test_parsing_toml(tmp_path: Path) -> None:
    casos = ev.carregar_casos(EXEMPLOS / "casos")
    assert 6 <= len(casos) <= 8
    assert all(c.fixture and c.fixture.is_dir() for c in casos)
    assert {c.dificuldade for c in casos} >= {"facil", "media", "dificil"}
    assert any(c.deve_acionar_skill is False for c in casos)
    vs, cfg = ev.carregar_variantes(EXEMPLOS / "variantes.toml")
    assert [v.nome for v in vs] == ["modelo-grande", "modelo-pequeno"]
    assert vs[0].com_skill and vs[0].sem_skill and cfg["tolerancia_pass_k"] == 0.05
    (tmp_path / "x.toml").write_text('id = "x"\nprompt = "p"\n', encoding="utf-8")
    with pytest.raises(ValueError, match="verificação"):
        ev.carregar_casos(tmp_path)


def test_segredo_literal_recusado(tmp_path: Path) -> None:
    f = tmp_path / "v.toml"
    f.write_text('[[variante]]\nnome="a"\ncomando="x"\nenv={ MY_API_KEY = "sk-literal" }\n', encoding="utf-8")
    with pytest.raises(ValueError, match="segredo"):
        ev.carregar_variantes(f)
    f.write_text('[[variante]]\nnome="a"\ncomando="x"\nenv={ MY_API_KEY = "$MY_API_KEY" }\n', encoding="utf-8")
    assert ev.carregar_variantes(f)[0][0].env["MY_API_KEY"] == "$MY_API_KEY"


def test_extrair_tokens() -> None:
    assert ev.extrair_tokens(r"entrada=(?P<entrada>\d+) saida=(?P<saida>\d+)", "uso: entrada=10 saida=20") == (10, 20)
    assert ev.extrair_tokens(r"in (\d+) out (\d+)", "in 5 out 6") == (5, 6)
    assert ev.extrair_tokens(None, "x") == (None, None)


def _cli(tmp_path: Path, *extra: str) -> Path:
    saida = tmp_path / "saida"
    rc = ev.main(["--config", str(EXEMPLOS / "variantes.toml"), "--casos-dir", str(EXEMPLOS / "casos"),
                  "--saida", str(saida), "--paralelo", "4", *extra])
    assert rc == 0
    return saida


def test_ponta_a_ponta_com_agente_fake(tmp_path: Path) -> None:
    saida = _cli(tmp_path, "--variantes", "modelo-grande,modelo-pequeno", "--repeticoes", "2")
    linhas = [json.loads(x) for x in (saida / "resultados.jsonl").read_text(encoding="utf-8").splitlines()]
    assert len(linhas) == 8 * 2 * 2
    assert {"caso", "variante", "tentativa", "sucesso", "motivo", "latencia_s", "custo", "acionou_skill"} <= set(linhas[0])
    rel = (saida / "relatorio.md").read_text(encoding="utf-8")
    for trecho in ("pass^k", "pass@k", "Custo/sucesso", "McNemar exato", "Recomendação", "modelo-grande", "modelo-pequeno"):
        assert trecho in rel
    por = {v: ev.resumo_variante(linhas, v) for v in ("modelo-grande", "modelo-pequeno")}
    assert por["modelo-grande"]["pass1"] > por["modelo-pequeno"]["pass1"]
    assert por["modelo-grande"]["custo_total"] > por["modelo-pequeno"]["custo_total"]
    # determinístico: segunda execução dá os mesmos sucessos
    saida2 = _cli(tmp_path / "b", "--variantes", "modelo-grande,modelo-pequeno", "--repeticoes", "2")
    l2 = [json.loads(x) for x in (saida2 / "resultados.jsonl").read_text(encoding="utf-8").splitlines()]
    chave = lambda r: (r["variante"], r["caso"], r["tentativa"])  # noqa: E731
    assert {chave(r): r["sucesso"] for r in linhas} == {chave(r): r["sucesso"] for r in l2}


def test_modo_skill_detecta_falso_positivo(tmp_path: Path) -> None:
    saida = _cli(tmp_path, "--variantes", "modelo-grande", "--skill-ab", "corrigir-bug", "--repeticoes", "3")
    linhas = [json.loads(x) for x in (saida / "resultados.jsonl").read_text(encoding="utf-8").splitlines()]
    ac = ev.acionamento(linhas, "modelo-grande+com-skill")
    assert ac["disponivel"] and ac["falsos_positivos"] > 0
    assert ev.acionamento(linhas, "modelo-grande+sem-skill")["falsos_positivos"] == 0
    rel = (saida / "relatorio.md").read_text(encoding="utf-8")
    assert "Modo skill" in rel and "falsos positivos" in rel and "Veredito" in rel


def test_veredito_skill_sintetico() -> None:
    regs = []
    for i in range(10):
        regs += [reg(f"c{i}", "com", 1, True), reg(f"c{i}", "sem", 1, i >= 5)]
    assert ev.veredito_skill(regs, "com", "sem", 0.05)["veredito"] == "útil"
    assert ev.veredito_skill(regs, "sem", "com", 0.05)["veredito"] == "prejudicial"
    igual = [reg(f"c{i}", v, 1, True) for i in range(5) for v in ("com", "sem")]
    assert ev.veredito_skill(igual, "com", "sem", 0.05)["veredito"] == "neutra"


def test_comando_que_falha_e_timeout(tmp_path: Path) -> None:
    caso = ev.Caso(id="t", descricao="", prompt="p", comando="true")
    lento = ev.Variante(nome="lento", comando="sleep 5")
    r = ev.executar_tentativa(caso, lento, 1, timeout=0.5)
    assert r["sucesso"] is False and r["motivo"] == "timeout" and r["latencia_s"] < 4
    quebra = ev.Variante(nome="quebra", comando="exit 3")
    assert ev.executar_tentativa(caso, quebra, 1, timeout=5)["motivo"].startswith("agente_erro")
    verif = ev.Caso(id="v", descricao="", prompt="p", comando="exit 1")
    ok = ev.Variante(nome="ok", comando="echo oi")
    assert ev.executar_tentativa(verif, ok, 1, timeout=5)["motivo"].startswith("verificar.comando")
    rx = ev.Caso(id="r", descricao="", prompt="p", regex_saida="^oi$", arquivos_esperados=["nao-existe.txt"])
    assert "arquivos_esperados" in ev.executar_tentativa(rx, ok, 1, timeout=5)["motivo"]


def test_selecionar_casos() -> None:
    casos = ev.carregar_casos(EXEMPLOS / "casos")
    assert len(ev.selecionar_casos(casos, "all")) == len(casos)
    assert {c.id for c in ev.selecionar_casos(casos, "negativo")} == {"ola-mundo"}
    assert [c.id for c in ev.selecionar_casos(casos, "slugify")] == ["slugify"]
    with pytest.raises(ValueError):
        ev.selecionar_casos(casos, "nada")
