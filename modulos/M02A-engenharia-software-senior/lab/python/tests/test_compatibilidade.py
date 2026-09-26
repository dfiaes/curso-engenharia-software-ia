"""Oraculos B14-L: corpus diferencial API em processo x CLI instalada.

Recorte M02A-B14-L (depende de B14-C): o mesmo corpus percorre a API em
processo e a CLI instalada fora do checkout, e a comparacao acontece sobre
a tupla decisao-codigo-valores normalizada, nunca sobre texto bruto
(AT-006). Reason codes e valores serializados coincidem nos dois caminhos,
inclusive para entradas invalidas, com fidelidade de tipos herdada do B04
(AT-010; AT-011 como heranca). Sobrecarga, timeout e cancelamento
cooperativo geram resultados distintos com cleanup observado, e o termino
de processo e declarado como nao-garantia (AT-022). API e CLI executam fora
do source tree a partir do wheel instalado, com origem afirmada (AT-040).
Sem adapter .NET: ponte com outra stack e trilha externa.

Limite auditavel desta suite: o ciclo de vida interno e provado sobre as
primitivas compartilhadas de runtime; o harness da CLI aplica os mesmos
gates (recusa antes do spawn, prazo no subprocesso com kill+reap,
cancelamento cooperativo da espera com cleanup) sem alegar que matar o
processo equivale a cancelar. Numeros de seeds, amostras, timeouts e
contagens sao exemplo variavel.
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
import time
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
from work_intake import compatibilidade as compat_mod
from work_intake.adapters.advisor import FakeAdvisor
from work_intake.adapters.sqlite import SQLiteEvaluationRepository
from work_intake.application.boundary import BoundaryError, parse_work_request_json
from work_intake.application.bounded_batch import run_bounded_batch
from work_intake.application.service import EvaluateWorkRequest
from work_intake.compatibilidade import (
    CODIGO_ADMITIDO_EXEMPLO,
    CODIGO_SOBRECARGA_EXEMPLO,
    CORPUS_B14L,
    CORPUS_GERADO_B14L,
    CORPUS_GOLDEN_B14L,
    DIGEST_B14L,
    EVENTOS_AT022_EXEMPLO,
    LIMITACOES_B14L,
    MOTIVO_SOBRECARGA_EXEMPLO,
    N_GERADOS_INVALIDOS_EXEMPLO,
    N_GERADOS_VALIDOS_EXEMPLO,
    NAO_GARANTIA_PROCESSO_EXEMPLO,
    PAYLOAD_GOLDEN_V1,
    PAYLOAD_GOLDEN_V2,
    SEED_B14L,
    TIMEOUT_CLI_EXEMPLO_S,
    ApiEmProcesso,
    CliInstalada,
    EntradaCorpus,
    admitir_ou_recusar,
    com_invalidez,
    comparar_caminhos,
    digest_corpus,
    entrada_de_payload,
    extrair_campos_boundary,
    fidelidade_tipos,
    normalizar_rejeicao,
    python_do_ambiente,
)
from work_intake.composition import build_evaluator
from work_intake.diagnostico import (
    TIMEOUT_EXEMPLO_S,
    ContagemDescarte,
    executar_possuida,
    faltantes_no_wheel,
    origem_instalada,
    ponto_entrada_presente,
)
from work_intake.domain.models import (
    AdvisorIdentity,
    Advisory,
    WorkRequest,
)
from work_intake.ports.advisor import AdvisorError


@dataclass(frozen=True, slots=True)
class InstalacaoB14L:
    """Wheel construido e extraido fora do checkout para os oraculos AT-040."""

    alvo: Path
    nomes: tuple[str, ...]
    checkout: str
    fora: Path


@pytest.fixture(scope="module")
def instalacao_b14l(tmp_path_factory: pytest.TempPathFactory) -> InstalacaoB14L:
    """Constroi o wheel uma vez e o expoe num diretorio fora do source tree."""
    lab_root = Path(__file__).resolve().parents[2]
    trabalho = tmp_path_factory.mktemp("b14l-instalacao")
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
    return InstalacaoB14L(
        alvo=alvo,
        nomes=nomes,
        checkout=str(lab_root / "python" / "src"),
        fora=fora,
    )


def _ambiente(site: Path) -> dict[str, str]:
    ambiente = dict(os.environ)
    ambiente["PYTHONPATH"] = str(site)
    ambiente.pop("PYTHONHOME", None)
    return ambiente


def _cli(
    instalacao: InstalacaoB14L, *, advisor: str = "fake", recording: Path | None = None
) -> CliInstalada:
    return CliInstalada(
        python=python_do_ambiente(),
        site=instalacao.alvo,
        checkout=instalacao.checkout,
        cwd=instalacao.fora,
        advisor=advisor,
        recording=recording,
    )


def _entrada_por_nome(nome: str) -> EntradaCorpus:
    for entrada in CORPUS_B14L:
        if entrada.nome == nome:
            return entrada
    raise AssertionError(f"entrada fora do corpus-exemplo: {nome}")


def test_corpus_tem_digest_congelado_e_tamper_quebra() -> None:
    """Evidencia recalculavel: seed mais corpus definem o digest; adulterar quebra."""
    assert digest_corpus(SEED_B14L, CORPUS_B14L) == DIGEST_B14L
    assert len(DIGEST_B14L) == 64
    assert digest_corpus(SEED_B14L, CORPUS_B14L[:-1]) != DIGEST_B14L
    assert len(CORPUS_GOLDEN_B14L) == 12
    assert len(CORPUS_GERADO_B14L) == N_GERADOS_VALIDOS_EXEMPLO + N_GERADOS_INVALIDOS_EXEMPLO
    assert all(entrada.esperado in ("valido", "invalido") for entrada in CORPUS_B14L)
    assert len({entrada.nome for entrada in CORPUS_B14L}) == len(CORPUS_B14L)
    assert len({entrada.bruto for entrada in CORPUS_B14L}) == len(CORPUS_B14L)


def test_golden_espelha_fixtures_congeladas(lab_root: Path) -> None:
    """O subconjunto golden e o herdado do B04: diverge da fixture e o teste acusa."""
    fixture_v1: dict[str, Any] = json.loads(
        (lab_root / "fixtures" / "golden" / "request-v1.json").read_text(encoding="utf-8")
    )
    assert fixture_v1 == PAYLOAD_GOLDEN_V1
    fixture_v2: dict[str, Any] = json.loads(
        (lab_root / "fixtures" / "compatibility" / "request-v2.json").read_text(encoding="utf-8")
    )
    assert fixture_v2 == PAYLOAD_GOLDEN_V2


def test_at006_mesma_decisao_api_e_cli_no_corpus(
    instalacao_b14l: InstalacaoB14L, tmp_path: Path
) -> None:
    """AT-006: acordo total no corpus golden e com motivo declarado no restante."""
    servico = build_evaluator(database=tmp_path / "api.db", advisor_kind="fake", recording=None)
    api, cli = compat_mod.compor(servico=servico, cli=_cli(instalacao_b14l))
    comparar_caminhos(CORPUS_B14L, api, cli)
    for entrada in CORPUS_B14L:
        decisao = api.decidir(entrada)
        assert (decisao.decisao != "rejeitado") == (entrada.esperado == "valido")
    arquivo = compat_mod.__file__
    assert arquivo is not None
    origem_api = str(Path(arquivo).resolve()).replace("\\", "/")
    assert origem_api.startswith(instalacao_b14l.checkout.replace("\\", "/"))


def test_at010_invalidos_rejeitam_com_mesmo_codigo_e_saida_2(
    instalacao_b14l: InstalacaoB14L, tmp_path: Path
) -> None:
    """AT-010: o invalido nunca e aceito de um lado so, nem com motivos diferentes."""
    servico = build_evaluator(database=tmp_path / "api.db", advisor_kind="fake", recording=None)
    api = ApiEmProcesso(servico=servico)
    cli = _cli(instalacao_b14l)
    invalidos = [e for e in CORPUS_B14L if e.esperado == "invalido"]
    assert len(invalidos) == 14
    familias = {e.familia for e in invalidos}
    assert {
        "versao",
        "extra",
        "intent",
        "orcamento",
        "prioridade",
        "chave",
        "json",
        "raiz",
    } <= familias
    for entrada in invalidos:
        a = api.decidir(entrada)
        b = cli.decidir(entrada)
        assert a.decisao == b.decisao == "rejeitado"
        assert a.codigo == b.codigo != ()
        area = tmp_path / f"neg-{entrada.nome}"
        area.mkdir()
        proc = _rodar_cli_direto(instalacao_b14l, entrada, area)
        assert proc.returncode == 2
        assert extrair_campos_boundary(proc.stderr) == a.codigo


def _rodar_cli_direto(
    instalacao: InstalacaoB14L, entrada: EntradaCorpus, area: Path
) -> subprocess.CompletedProcess[str]:
    pedido = area / "pedido.json"
    banco = area / "direto.db"
    pedido.write_text(entrada.bruto, encoding="utf-8")
    return subprocess.run(
        [
            sys.executable,
            "-m",
            "work_intake.cli",
            "evaluate",
            str(pedido),
            "--database",
            str(banco),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(instalacao.fora),
        env=_ambiente(instalacao.alvo),
        timeout=TIMEOUT_CLI_EXEMPLO_S,
    )


def test_at010_at011_fidelidade_de_tipos_nos_dois_caminhos(
    instalacao_b14l: InstalacaoB14L, tmp_path: Path
) -> None:
    """AT-010/011: decimal, timezone, UTF-8 e enum preservados do mesmo jeito."""
    servico = build_evaluator(database=tmp_path / "api.db", advisor_kind="fake", recording=None)
    api = ApiEmProcesso(servico=servico)
    cli = _cli(instalacao_b14l)
    for nome in ("golden-v1-valido", "golden-v2-valido"):
        entrada = _entrada_por_nome(nome)
        pedido = parse_work_request_json(entrada.bruto)
        fiel = dict(fidelidade_tipos(pedido))
        if nome == "golden-v1-valido":
            assert fiel["budget"] == "750.00"
            assert fiel["deadline_utc"] == "2026-09-01T12:00:00+00:00"
            assert "ação" in fiel["intent"] and "português" in fiel["intent"]
            assert fiel["priority"] == "normal"
            assert fiel["source"] == ""
        else:
            assert fiel["budget"] == "900.50"
            assert fiel["source"] == "import"
        a = api.decidir(entrada)
        b = cli.decidir(entrada)
        assert (a.decisao, a.codigo, a.valores) == (b.decisao, b.codigo, b.valores)
        assert dict(b.valores)["budget"] == fiel["budget"]


def test_troca_de_adapter_no_composition_root_mantem_corpus_verde(
    instalacao_b14l: InstalacaoB14L, tmp_path: Path
) -> None:
    """ES26-054: fake por record-replay sem tocar consumidor, politica ou CLI."""
    gravacao = instalacao_b14l.fora / "rec-b14l.json"
    gravacao.write_text(
        json.dumps(
            {
                "recording_version": "1.0",
                "adapter": "record-replay",
                "adapter_version": "b14l-exemplo",
                "entries": {
                    request_id: {
                        "category": "delivery",
                        "risk": "low",
                        "confidence": "0.9",
                        "signals": ["routine_delivery"],
                    }
                    for request_id in ("req-onboard-001", "req-onboard-002")
                },
            },
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    validos = [e for e in CORPUS_GOLDEN_B14L if e.esperado == "valido"]
    api_fake = ApiEmProcesso(
        servico=build_evaluator(database=tmp_path / "fake.db", advisor_kind="fake", recording=None)
    )
    comparar_caminhos(validos, api_fake, _cli(instalacao_b14l))
    api_replay = ApiEmProcesso(
        servico=build_evaluator(
            database=tmp_path / "replay.db", advisor_kind="replay", recording=gravacao
        )
    )
    comparar_caminhos(
        validos, api_replay, _cli(instalacao_b14l, advisor="replay", recording=gravacao)
    )
    for entrada in validos:
        a = api_fake.decidir(entrada)
        b = api_replay.decidir(entrada)
        assert (a.decisao, a.codigo, a.valores) == (b.decisao, b.codigo, b.valores)


def test_adapter_que_fortalece_precondicao_falha_no_contrato(tmp_path: Path) -> None:
    """ES26-054 negativo: tipar certo nao salva quem recusa entrada contratada."""

    class AdvisorExigente:
        @property
        def identity(self) -> AdvisorIdentity:
            return AdvisorIdentity(adapter="exigente-exemplo", version="1.0")

        def advise(self, request: WorkRequest) -> Advisory:
            raise AdvisorError("recusa entrada contratada-exemplo")

    entrada = _entrada_por_nome("golden-v1-valido")
    api_estrita = ApiEmProcesso(
        servico=EvaluateWorkRequest(
            repository=SQLiteEvaluationRepository(tmp_path / "estrita.db"),
            advisor=AdvisorExigente(),
        )
    )
    api_fake = ApiEmProcesso(
        servico=EvaluateWorkRequest(
            repository=SQLiteEvaluationRepository(tmp_path / "fake.db"),
            advisor=FakeAdvisor(),
        )
    )
    a = api_estrita.decidir(entrada)
    f = api_fake.decidir(entrada)
    assert (a.decisao, a.codigo) != (f.decisao, f.codigo)
    assert "advisor_risk_escalation" in a.codigo
    assert f.codigo == ("deterministic_policy_passed",)


def test_at022_sobrecarga_recusa_na_admissao_sem_criar_tarefa() -> None:
    """AT-022: sobrecarga e recusa explicita; a tarefa nem nasce e a fila segue limitada."""
    criadas: dict[str, int] = {"api": 0, "cli": 0}

    def _trabalho_api() -> str:
        criadas["api"] += 1
        return "ok-exemplo"

    def _trabalho_cli() -> str:
        criadas["cli"] += 1
        return "ok-exemplo"

    assert admitir_ou_recusar(capacidade=2, em_espera=2, ao_admitir=_trabalho_api) == (
        CODIGO_SOBRECARGA_EXEMPLO,
        MOTIVO_SOBRECARGA_EXEMPLO,
    )
    assert admitir_ou_recusar(capacidade=2, em_espera=5, ao_admitir=_trabalho_cli) == (
        CODIGO_SOBRECARGA_EXEMPLO,
        MOTIVO_SOBRECARGA_EXEMPLO,
    )
    assert criadas == {"api": 0, "cli": 0}
    assert admitir_ou_recusar(capacidade=2, em_espera=1, ao_admitir=_trabalho_api) == (
        CODIGO_ADMITIDO_EXEMPLO,
        "ok-exemplo",
    )
    assert criadas["api"] == 1
    with pytest.raises(ValueError):
        admitir_ou_recusar(capacidade=0, em_espera=0, ao_admitir=_trabalho_api)

    async def _lenta(item: int) -> None:
        await asyncio.sleep(0.05)

    async def _cenario() -> Any:
        return await run_bounded_batch(
            [1, 2, 3, 4], capacity=1, admission_timeout=0.001, worker=_lenta
        )

    resultado = asyncio.run(_cenario())
    assert resultado.rejected >= 1
    assert resultado.max_queue_depth <= 1
    assert resultado.cleanup_ran


def test_at022_timeout_cancela_com_cleanup_e_sem_orfa(
    instalacao_b14l: InstalacaoB14L, tmp_path: Path
) -> None:
    """AT-022: prazo estourado cancela a operacao possuida; cleanup executa e descarte conta."""
    contagem = ContagemDescarte()
    limpo = asyncio.Event()

    async def _operacao() -> None:
        try:
            await asyncio.Event().wait()
        finally:
            limpo.set()

    async def _cenario() -> str:
        return await executar_possuida(_operacao, seconds=TIMEOUT_EXEMPLO_S, contagem=contagem)

    assert asyncio.run(_cenario()) == "timeout-com-cleanup-exemplo"
    assert limpo.is_set()
    assert contagem.timeouts == 1

    async def _sem_orfa() -> bool:
        async def _operacao2() -> None:
            await asyncio.Event().wait()

        tarefa = asyncio.create_task(
            executar_possuida(_operacao2, seconds=TIMEOUT_EXEMPLO_S, contagem=ContagemDescarte())
        )
        resultado = await tarefa
        return tarefa.done() and resultado == "timeout-com-cleanup-exemplo"

    assert asyncio.run(_sem_orfa())
    assert CODIGO_SOBRECARGA_EXEMPLO != "timeout-com-cleanup-exemplo"

    pedido = tmp_path / "pedido-timeout.json"
    pedido.write_text(_entrada_por_nome("golden-v1-valido").bruto, encoding="utf-8")
    limpeza = tmp_path / "timeout-limpo.tmp"
    limpeza.write_text("pendente", encoding="utf-8")
    descartes = 0
    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "work_intake.cli",
                "evaluate",
                str(pedido),
                "--database",
                str(tmp_path / "timeout.db"),
            ],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=str(instalacao_b14l.fora),
            env=_ambiente(instalacao_b14l.alvo),
            timeout=0.001,
        )
        raise AssertionError("CLI instalada deveria exceder o prazo-exemplo")
    except subprocess.TimeoutExpired:
        descartes += 1
    finally:
        limpeza.unlink(missing_ok=True)
    assert descartes == 1
    assert not limpeza.exists()


def test_at022_cancelamento_cooperativo_propaga_com_cleanup(
    instalacao_b14l: InstalacaoB14L, tmp_path: Path
) -> None:
    """AT-022: pedido externo so efetiva no checkpoint; finally executa e propaga."""
    contagem = ContagemDescarte()
    limpo = asyncio.Event()
    iniciado = asyncio.Event()

    async def _operacao() -> None:
        iniciado.set()
        try:
            await asyncio.Event().wait()
        finally:
            limpo.set()

    async def _cenario() -> None:
        tarefa = asyncio.create_task(executar_possuida(_operacao, seconds=30.0, contagem=contagem))
        await iniciado.wait()
        tarefa.cancel()
        with pytest.raises(asyncio.CancelledError):
            await tarefa

    asyncio.run(_cenario())
    assert limpo.is_set()
    assert contagem.cancelamentos_externos == 1

    pedido = tmp_path / "pedido-cancel.json"
    pedido.write_text(_entrada_por_nome("golden-v1-valido").bruto, encoding="utf-8")
    marcador = tmp_path / "cancel-limpo.tmp"

    async def _espera_cli() -> None:
        proc = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "work_intake.cli",
                "evaluate",
                str(pedido),
                "--database",
                str(tmp_path / "cancel.db"),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(instalacao_b14l.fora),
            env=_ambiente(instalacao_b14l.alvo),
        )
        try:
            await asyncio.sleep(60.0)
            proc.wait(timeout=TIMEOUT_CLI_EXEMPLO_S)
        finally:
            if proc.poll() is None:
                proc.kill()
            proc.wait()
            marcador.write_text("limpo", encoding="utf-8")

    async def _cenario_cli() -> None:
        tarefa = asyncio.create_task(_espera_cli())
        await asyncio.sleep(0.01)
        tarefa.cancel()
        with pytest.raises(asyncio.CancelledError):
            await tarefa

    asyncio.run(_cenario_cli())
    assert marcador.read_text(encoding="utf-8") == "limpo"


def test_at022_morte_de_processo_nao_garante_cleanup(tmp_path: Path) -> None:
    """AT-022 negativo: encerrar o processo nao e cancelamento; nada e prometido."""
    marcador = tmp_path / "finally-nao-executado.tmp"
    filho = tmp_path / "filho.py"
    filho.write_text(
        "import sys\nimport time\ntry:\n    time.sleep(60)\nfinally:\n"
        "    open(sys.argv[1], 'w').write('limpo')\n",
        encoding="utf-8",
    )
    proc = subprocess.Popen(
        [sys.executable, str(filho), str(marcador)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(tmp_path),
    )
    time.sleep(0.2)
    proc.kill()
    saida, _erro = proc.communicate()
    assert proc.returncode != 0
    assert saida == b""
    assert not marcador.exists()
    assert NAO_GARANTIA_PROCESSO_EXEMPLO == "morte-de-processo-sem-garantia-exemplo"


def test_at040_ambos_os_caminhos_fora_do_checkout(instalacao_b14l: InstalacaoB14L) -> None:
    """AT-040: API e CLI executam o artefato instalado, nunca o checkout por acidente."""
    assert faltantes_no_wheel(instalacao_b14l.nomes) == ()
    dist_infos = [p for p in instalacao_b14l.alvo.iterdir() if p.name.endswith(".dist-info")]
    assert len(dist_infos) == 1
    texto_entry_points = (dist_infos[0] / "entry_points.txt").read_text(encoding="utf-8")
    assert ponto_entrada_presente(texto_entry_points)
    assert "work_intake.cli:main" in texto_entry_points

    sonda_api = (
        "import json, sys;"
        "from pathlib import Path;"
        "checkout, db = sys.argv[1], sys.argv[2];"
        "import work_intake.compatibilidade as compat;"
        "origem = str(Path(compat.__file__).resolve());"
        "from work_intake.diagnostico import origem_instalada;"
        "assert origem_instalada(origem, checkout), origem;"
        "from work_intake.application.boundary import parse_work_request_json;"
        "from work_intake.composition import build_evaluator;"
        "bruto = sys.stdin.read();"
        "pedido = parse_work_request_json(bruto);"
        "avaliador = build_evaluator(database=Path(db), advisor_kind='fake', recording=None);"
        "saida = avaliador.execute(pedido).as_payload();"
        "print(json.dumps({'origem': origem, 'outcome': saida['outcome'],"
        " 'request_id': saida['request_id']}))"
    )
    banco_api = instalacao_b14l.fora / "api-instalada.db"
    proc_api = subprocess.run(
        [sys.executable, "-c", sonda_api, instalacao_b14l.checkout, str(banco_api)],
        input=_entrada_por_nome("golden-v1-valido").bruto,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(instalacao_b14l.fora),
        env=_ambiente(instalacao_b14l.alvo),
        timeout=TIMEOUT_CLI_EXEMPLO_S,
    )
    assert proc_api.returncode == 0, proc_api.stderr
    resposta_api: dict[str, Any] = json.loads(proc_api.stdout)
    assert resposta_api["request_id"] == "req-onboard-001"
    assert resposta_api["outcome"] in ("accept", "review", "reject")
    assert instalacao_b14l.checkout not in resposta_api["origem"].replace("\\", "/")

    sonda_cli = (
        "from pathlib import Path; import work_intake.cli; "
        "print(str(Path(work_intake.cli.__file__).resolve()))"
    )
    proc_origem = subprocess.run(
        [sys.executable, "-c", sonda_cli],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(instalacao_b14l.fora),
        env=_ambiente(instalacao_b14l.alvo),
        timeout=TIMEOUT_CLI_EXEMPLO_S,
    )
    assert proc_origem.returncode == 0, proc_origem.stderr
    assert origem_instalada(proc_origem.stdout.strip(), instalacao_b14l.checkout)

    pedido = instalacao_b14l.fora / "pedido-instalado.json"
    pedido.write_text(_entrada_por_nome("golden-v1-valido").bruto, encoding="utf-8")
    proc_cli = subprocess.run(
        [
            sys.executable,
            "-m",
            "work_intake.cli",
            "evaluate",
            str(pedido),
            "--database",
            str(instalacao_b14l.fora / "cli-instalada.db"),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(instalacao_b14l.fora),
        env=_ambiente(instalacao_b14l.alvo),
        timeout=TIMEOUT_CLI_EXEMPLO_S,
    )
    assert proc_cli.returncode == 0, proc_cli.stderr
    payload_cli: dict[str, Any] = json.loads(proc_cli.stdout)
    assert payload_cli["request_id"] == "req-onboard-001"

    invalido = instalacao_b14l.fora / "invalido-instalado.json"
    invalido.write_text(_entrada_por_nome("golden-invalido-orcamento").bruto, encoding="utf-8")
    proc_negado = subprocess.run(
        [
            sys.executable,
            "-m",
            "work_intake.cli",
            "evaluate",
            str(invalido),
            "--database",
            str(instalacao_b14l.fora / "cli-instalada.db"),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(instalacao_b14l.fora),
        env=_ambiente(instalacao_b14l.alvo),
        timeout=TIMEOUT_CLI_EXEMPLO_S,
    )
    assert proc_negado.returncode == 2
    assert extrair_campos_boundary(proc_negado.stderr) == ("budget",)


def test_eventos_at022_sao_distintos_e_declaram_cleanup() -> None:
    """AT-022: sobrecarga, timeout, cancelamento e morte nunca partilham o mesmo sinal."""
    assert CODIGO_SOBRECARGA_EXEMPLO != "timeout-com-cleanup-exemplo"
    assert NAO_GARANTIA_PROCESSO_EXEMPLO not in (
        CODIGO_SOBRECARGA_EXEMPLO,
        "timeout-com-cleanup-exemplo",
    )
    assert len(EVENTOS_AT022_EXEMPLO) == 4
    assert len(set(EVENTOS_AT022_EXEMPLO)) == 4
    assert LIMITACOES_B14L and all(limite for limite in LIMITACOES_B14L)


def test_rejeicao_normalizada_ordena_campos_e_compara_por_tupla() -> None:
    """Contrato da tupla: codigo ordenado, decisao marcada, valores fora do erro."""
    a = normalizar_rejeicao(("budget", "intent"))
    b = normalizar_rejeicao(("intent", "budget"))
    assert a == b
    assert a.decisao == "rejeitado"
    assert a.valores == ()
    with pytest.raises(BoundaryError):
        parse_work_request_json("{nao-json")
    assert com_invalidez("orcamento", dict(PAYLOAD_GOLDEN_V1))[1] == ("budget",)
    assert entrada_de_payload("x", "valido", PAYLOAD_GOLDEN_V1).esperado == "valido"
