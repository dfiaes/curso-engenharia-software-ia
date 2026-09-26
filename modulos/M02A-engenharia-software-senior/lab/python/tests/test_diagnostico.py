"""Oraculos B13-L: instalacao limpa, portabilidade, fronteira e descarte herdado."""

from __future__ import annotations

import asyncio
import dataclasses
import json
import os
import subprocess
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath

import pytest
from work_intake.diagnostico import (
    CORPUS_B13L,
    DIGEST_B13L,
    FRONTEIRA_B13L,
    SEED_B13L,
    TIMEOUT_EXEMPLO_S,
    ContagemDescarte,
    FronteiraCampos,
    ValorAdmitido,
    admitir_pedido,
    admitir_valor,
    construir_caminho,
    diagnosticar_ambiente,
    digest_normalizacao,
    executar_possuida,
    exigir_admitido,
    exigir_nome_portavel,
    faltantes_no_wheel,
    forma_normalizada_caminho,
    iterar_linhas,
    materializar_linhas,
    normalizar_chave,
    normalizar_entrada,
    normalizar_newline,
    origem_instalada,
    ponto_entrada_presente,
)


@dataclass(frozen=True, slots=True)
class InstalacaoLimpa:
    """Wheel construido e extraido fora do checkout para os oraculos AT-040."""

    alvo: Path
    nomes: tuple[str, ...]
    checkout: str
    fora_do_checkout: Path
    fixture: Path


@pytest.fixture(scope="module")
def instalacao_limpa(tmp_path_factory: pytest.TempPathFactory) -> InstalacaoLimpa:
    """Constroi o wheel uma vez e o expoe num diretorio fora do source tree."""
    lab_root = Path(__file__).resolve().parents[2]
    trabalho = tmp_path_factory.mktemp("b13l-instalacao")
    dist = trabalho / "dist"
    dist.mkdir()
    build = subprocess.run(
        [sys.executable, "-m", "build", "--wheel", "--no-isolation", "--outdir", str(dist)],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=lab_root,
    )
    assert build.returncode == 0, build.stderr
    wheels = sorted(dist.glob("*.whl"))
    assert len(wheels) == 1
    alvo = trabalho / "site"
    alvo.mkdir()
    with zipfile.ZipFile(wheels[0]) as pacote:
        nomes = tuple(pacote.namelist())
        pacote.extractall(alvo)
    fora = trabalho / "fora-do-checkout"
    fora.mkdir()
    fixture = fora / "request-v1.json"
    fixture.write_text(
        (lab_root / "fixtures" / "golden" / "request-v1.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    return InstalacaoLimpa(
        alvo=alvo,
        nomes=nomes,
        checkout=str(lab_root / "python" / "src"),
        fora_do_checkout=fora,
        fixture=fixture,
    )


def _ambiente_instalado(instalacao_limpa: InstalacaoLimpa) -> dict[str, str]:
    ambiente = dict(os.environ)
    ambiente["PYTHONPATH"] = str(instalacao_limpa.alvo)
    ambiente.pop("PYTHONHOME", None)
    return ambiente


def test_escolha_idiomatica_gerador_contra_lista() -> None:
    """ES26-049: gerador preguicoso e lista materializada concordam; custo difere."""
    texto = "linha-a\nlinha-b\nlinha-c"
    gerador = iterar_linhas(texto)
    assert next(gerador) == "linha-a"
    assert list(gerador) == ["linha-b", "linha-c"]
    assert materializar_linhas(texto) == ["linha-a", "linha-b", "linha-c"]
    assert len(materializar_linhas(texto)) == 3


def test_newline_todas_as_familias_viram_lf() -> None:
    """AT-041: LF, CRLF e CR legado convergem para quebra unica na entrada."""
    assert normalizar_newline("a\nb") == "a\nb"
    assert normalizar_newline("a\r\nb\r\nc") == "a\nb\nc"
    assert normalizar_newline("a\rb\rc") == "a\nb\nc"
    assert normalizar_newline("a\rb\nc\r\nd") == "a\nb\nc\nd"


def test_normalizar_entrada_chave_e_caminho_antes_da_regra() -> None:
    """AT-041: trecho conceitual em forma executavel; mesmas entradas, mesma saida."""
    chave, forma = normalizar_entrada(
        "Titulo Exemplo\r\nSegunda Linha", PurePosixPath("Rels/Ev.JSON")
    )
    assert (chave, forma) == normalizar_entrada(
        "TITULO EXEMPLO\nSEGUNDA LINHA", PureWindowsPath("rels\\ev.json")
    )
    assert chave == "titulo exemplo\nsegunda linha"
    assert forma == "rels/ev.json"


def test_casing_unicode_dobra_antes_de_comparar() -> None:
    """AT-041: igualdade direta quebra fora do exemplo do autor; casefold nao."""
    eszett: str = "Straße Exemplo"
    caixa_alta: str = "STRASSE EXEMPLO"
    assert eszett != caixa_alta
    assert normalizar_chave(eszett) == normalizar_chave(caixa_alta)
    with pytest.raises(ValueError):
        normalizar_chave("   ")


def test_paths_com_pathlib_e_nome_reservado_nega() -> None:
    """AT-041: pathlib monta nos dois sistemas; reserva do Windows falha cedo."""
    win = PureWindowsPath("C:\\labs\\Evidence.JSON")
    posix = PurePosixPath("/tmp/labs/evidence.json")
    assert forma_normalizada_caminho(win) == "c:/labs/evidence.json"
    assert win.name.casefold() == posix.name.casefold()
    assert exigir_nome_portavel("evidence.json") == "evidence.json"
    with pytest.raises(ValueError):
        exigir_nome_portavel("CON")
    with pytest.raises(ValueError):
        exigir_nome_portavel("pasta/arquivo.json")
    caminho = construir_caminho("relatorios", "evidencia.json")
    assert caminho == Path("relatorios") / "evidencia.json"
    with pytest.raises(ValueError):
        construir_caminho("relatorios", "")


def test_fronteira_admite_e_rejeita_no_trust_boundary() -> None:
    """ES26-050: admitido recebe valor; ausente, desconhecido e nao-mapeamento negam."""
    estado, valor = admitir_pedido(FRONTEIRA_B13L, {"titulo": "t-exemplo", "intencao": "i-exemplo"})
    assert estado == "admitido"
    assert isinstance(valor, tuple)
    assert ("titulo", "t-exemplo") in valor
    assert admitir_pedido(FRONTEIRA_B13L, {"titulo": "t-exemplo"})[0] == "rejeitado"
    assert (
        admitir_pedido(FRONTEIRA_B13L, {"titulo": "t", "intencao": "i", "extra": "x"})[0]
        == "rejeitado"
    )
    assert admitir_pedido(FRONTEIRA_B13L, ["nao-mapeamento-exemplo"])[0] == "rejeitado"
    assert admitir_pedido(FRONTEIRA_B13L, {"titulo": "t", "intencao": 7})[0] == "rejeitado"


def test_fronteira_estrita_recusa_coercao_mas_coagir_declara() -> None:
    """ES26-050: coercao ajuda e mente; so vale declarada na fronteira."""
    dado: object = {"titulo": "t-exemplo", "intencao": 7}
    assert not FRONTEIRA_B13L.validar(dado).ok
    tolerante = FronteiraCampos(
        campos_exigidos=frozenset({"titulo", "intencao"}),
        coagir=True,
    )
    resultado = tolerante.validar(dado)
    assert resultado.ok and ("intencao", "7") in resultado.campos


def test_construcao_sem_validador_e_mutacao_pos_validacao_negam() -> None:
    """ES26-050: tipo valido sem carimbo nao entra; admitido nao muta."""
    with pytest.raises(ValueError):
        exigir_admitido(ValorAdmitido(campos=(("titulo", "t-exemplo"),)))
    admitido = admitir_valor(FRONTEIRA_B13L.validar({"titulo": "t", "intencao": "i"}))
    assert exigir_admitido(admitido) == (("intencao", "i"), ("titulo", "t"))
    with pytest.raises(ValueError):
        admitir_valor(FRONTEIRA_B13L.validar({"titulo": "so-titulo-exemplo"}))
    with pytest.raises(dataclasses.FrozenInstanceError):
        admitido.via_fronteira = True  # type: ignore[misc]


def test_oraculo_puro_origem_instalada_nunca_aponta_para_checkout() -> None:
    """AT-040 conceitual: origem vazia ou sob o checkout falha; instalada passa."""
    assert origem_instalada("/tmp/site/work_intake/diagnostico.py", "/repo/lab/python/src")
    assert not origem_instalada(
        "/repo/lab/python/src/work_intake/diagnostico.py", "/repo/lab/python/src"
    )
    assert not origem_instalada("", "/repo/lab/python/src")
    assert not origem_instalada(
        "C:\\repo\\lab\\python\\src\\work_intake\\x.py", "C:\\repo\\lab\\python\\src"
    )


def test_api_instalada_executa_fora_do_checkout(instalacao_limpa: InstalacaoLimpa) -> None:
    """AT-040: API do artefato instalado decide fora do source tree."""
    assert faltantes_no_wheel(instalacao_limpa.nomes) == ()
    sonda = (
        "import json, sys;"
        "from pathlib import Path;"
        "checkout, fixture, db = sys.argv[1], sys.argv[2], sys.argv[3];"
        "import work_intake.diagnostico as diag;"
        "origem = str(Path(diag.__file__).resolve());"
        "assert diag.origem_instalada(origem, checkout), origem;"
        "from work_intake.application.boundary import parse_work_request_json;"
        "from work_intake.composition import build_evaluator;"
        "pedido = parse_work_request_json(Path(fixture).read_text(encoding='utf-8'));"
        "avaliador = build_evaluator(database=Path(db), advisor_kind='fake', recording=None);"
        "saida = avaliador.execute(pedido).as_payload();"
        "relato = {'origem': origem, 'outcome': saida['outcome']};"
        "relato['request_id'] = saida['request_id'];"
        "print(json.dumps(relato))"
    )
    banco = instalacao_limpa.fora_do_checkout / "api-instalada.db"
    saida = subprocess.run(
        [
            sys.executable,
            "-c",
            sonda,
            instalacao_limpa.checkout,
            str(instalacao_limpa.fixture),
            str(banco),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=instalacao_limpa.fora_do_checkout,
        env=_ambiente_instalado(instalacao_limpa),
    )
    assert saida.returncode == 0, saida.stderr
    resposta = json.loads(saida.stdout)
    assert resposta["request_id"] == "req-onboard-001"
    assert resposta["outcome"] in ("accept", "review", "reject")
    assert instalacao_limpa.checkout not in resposta["origem"].replace("\\", "/")


def test_cli_instalada_responde_pelo_ponto_de_entrada(instalacao_limpa: InstalacaoLimpa) -> None:
    """AT-040: CLI instalada avalia o fixture fora do checkout pelo entry point."""
    dist_infos = [p for p in instalacao_limpa.alvo.iterdir() if p.name.endswith(".dist-info")]
    assert len(dist_infos) == 1
    texto_entry_points = (dist_infos[0] / "entry_points.txt").read_text(encoding="utf-8")
    assert ponto_entrada_presente(texto_entry_points)
    assert "work_intake.cli:main" in texto_entry_points
    banco = instalacao_limpa.fora_do_checkout / "cli-instalada.db"
    saida = subprocess.run(
        [
            sys.executable,
            "-m",
            "work_intake.cli",
            "evaluate",
            str(instalacao_limpa.fixture),
            "--database",
            str(banco),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=instalacao_limpa.fora_do_checkout,
        env=_ambiente_instalado(instalacao_limpa),
    )
    assert saida.returncode == 0, saida.stderr
    payload = json.loads(saida.stdout)
    assert payload["request_id"] == "req-onboard-001"
    invalido = instalacao_limpa.fora_do_checkout / "invalido.json"
    invalido.write_text('{"nao": "e-pedido-exemplo"}', encoding="utf-8")
    negada = subprocess.run(
        [
            sys.executable,
            "-m",
            "work_intake.cli",
            "evaluate",
            str(invalido),
            "--database",
            str(banco),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=instalacao_limpa.fora_do_checkout,
        env=_ambiente_instalado(instalacao_limpa),
    )
    assert negada.returncode == 2


def test_cancelamento_externo_executa_cleanup_e_propaga() -> None:
    """AT-020 herdado: cancelamento externo roda o finally e chega ao chamador."""
    contagem = ContagemDescarte()
    limpo = asyncio.Event()
    iniciado = asyncio.Event()

    async def operacao() -> None:
        iniciado.set()
        try:
            await asyncio.Event().wait()
        finally:
            limpo.set()

    async def cenario() -> None:
        tarefa = asyncio.create_task(executar_possuida(operacao, seconds=30.0, contagem=contagem))
        await iniciado.wait()
        tarefa.cancel()
        with pytest.raises(asyncio.CancelledError):
            await tarefa

    asyncio.run(cenario())
    assert limpo.is_set()
    assert contagem.cancelamentos_externos == 1
    assert contagem.concluidas == 0


def test_timeout_nao_deixa_orfa_e_contabiliza_descarte() -> None:
    """AT-021 herdado: prazo cancela a operacao possuida com cleanup e contagem."""
    contagem = ContagemDescarte()
    limpo = asyncio.Event()

    async def operacao() -> None:
        try:
            await asyncio.Event().wait()
        finally:
            limpo.set()

    async def cenario() -> str:
        return await executar_possuida(operacao, seconds=TIMEOUT_EXEMPLO_S, contagem=contagem)

    assert asyncio.run(cenario()) == "timeout-com-cleanup-exemplo"
    assert limpo.is_set()
    assert contagem.timeouts == 1
    with pytest.raises(ValueError):
        asyncio.run(executar_possuida(operacao, seconds=0.0, contagem=contagem))


def test_ambiente_diagnostica_origem_e_digest_recalcula() -> None:
    """AT-040/041: ambiente com origem afirmada; corpus com digest recalculavel."""
    ambiente = diagnosticar_ambiente()
    for chave in ("so", "runtime", "executavel", "origem_modulo", "cwd"):
        assert ambiente[chave], chave
    assert Path(ambiente["origem_modulo"]).name == "diagnostico.py"
    assert digest_normalizacao(SEED_B13L, CORPUS_B13L) == DIGEST_B13L
    assert len(DIGEST_B13L) == 64
    assert digest_normalizacao(SEED_B13L, CORPUS_B13L[1:]) != DIGEST_B13L
