"""Compatibilidade Python: API em processo e CLI instalada decidem igual (B14-L).

Contratos VERBATIM da secao <section id="b14"> de M02A.html: a mesma decisao
pela API Python em processo e pela CLI instalada fora do checkout sobre o
mesmo corpus (ES26-056; AT-006); reason codes e valores serializados
identicos nos dois caminhos, inclusive para entradas invalidas, com a
preservacao de tipos herdada do B04 exigida do mesmo jeito nos dois lados
(ES26-053; AT-010; AT-011 como heranca); troca de adapter no composition
root sem tocar o consumidor, com a mesma suite comportamental verde nos
dois (ES26-054); sobrecarga, timeout e cancelamento cooperativo com
resultados distintos e cleanup observado, e termino de processo declarado
como nao-garantia de cleanup (ES26-055; AT-022); instalacao limpa exercida
pelos dois caminhos com origem afirmada (AT-040). Sem adapter .NET: ponte
com outra stack e trilha externa com corpus e ambiente proprios.

Comparacao diferencial sobre valores normalizados (forma executavel do
trecho conceitual do bloco)::

    for entrada in entradas:
        a = api_em_processo.decidir(entrada).normalizada()
        b = cli_instalada.decidir(entrada).normalizada()
        assert (a.decisao, a.codigo, a.valores) == (b.decisao, b.codigo, b.valores)

Saida bruta, formatacao e ordem de chaves ficam fora da comparacao; reason
code e valor serializado ficam dentro, inclusive no caminho de erro. Cada
lado afirma a propria origem (AT-040): a API registra o modulo em processo,
a CLI executa o artefato instalado fora do source tree via wheel extraido e
``PYTHONPATH``, nunca o checkout por acidente.

Limite auditavel: sem rede, sem Docker, sem Windows real e sem provedor
real. Os valores diferenciais sao a intersecao observavel nos dois
caminhos (request_id, outcome, policy_version, contract_version, budget, o
ultimo via manifesto ``--evidence`` da CLI); a fidelidade fina de tipos
(deadline UTC, intent UTF-8, prioridade, source) e provada por teste
dedicado com expectativas identicas nos dois lados, e qualquer coercao
unilateral que mude semantica vira divergencia de decisao ou de rejeicao
no corpus. O ciclo de vida interno (admissao, prazo, cancelamento) e
provado sobre as primitivas compartilhadas de runtime; o harness da CLI
aplica os mesmos gates (recusa antes do spawn, prazo no subprocesso,
cancelamento cooperativo da espera com cleanup) sem alegar que matar o
processo equivale a cancelar. Numeros de seeds, amostras, timeouts e
contagens sao exemplo variavel: a reprodutibilidade vem de seed, amostra
bruta e digest, nunca do numero impresso.
"""

from __future__ import annotations

import hashlib
import json
import os
import random
import re
import subprocess
import sys
import tempfile
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC
from pathlib import Path
from typing import Any, Final, Protocol

from work_intake.application.boundary import BoundaryError, parse_work_request_json
from work_intake.application.service import EvaluateWorkRequest
from work_intake.domain.models import EvaluationResult, WorkRequest

SEED_B14L: Final[int] = 20260923
N_GERADOS_VALIDOS_EXEMPLO: Final[int] = 6
N_GERADOS_INVALIDOS_EXEMPLO: Final[int] = 4
TIMEOUT_CLI_EXEMPLO_S: Final[float] = 120.0

CODIGO_SOBRECARGA_EXEMPLO: Final[str] = "recusado-capacidade-exemplo"
MOTIVO_SOBRECARGA_EXEMPLO: Final[str] = "fila-cheia-na-admissao-exemplo"
CODIGO_ADMITIDO_EXEMPLO: Final[str] = "admitido-exemplo"
NAO_GARANTIA_PROCESSO_EXEMPLO: Final[str] = "morte-de-processo-sem-garantia-exemplo"

EVENTOS_AT022_EXEMPLO: Final[tuple[str, ...]] = (
    "sobrecarga-na-admissao",
    "timeout-da-operacao",
    "cancelamento-cooperativo",
    "termino-do-processo",
)

LIMITACOES_B14L: Final[tuple[str, ...]] = (
    "recorte local sem rede, Docker, provedor real ou Windows observado",
    "diferencial sobre a intersecao observavel; fidelidade fina em teste dedicado",
    "matar o processo nao e cancelar: sem finally, flush ou escrita garantidos",
    "sem adapter .NET: ponte com outra stack e trilha externa",
    "numeros sao exemplo variavel: validos para seed/amostra/digest acima",
)


@dataclass(frozen=True, slots=True)
class EntradaCorpus:
    """Um caso do corpus diferencial: nome, bruto serializado e classe esperada."""

    nome: str
    bruto: str
    esperado: str  # "valido" | "invalido"
    familia: str


@dataclass(frozen=True, slots=True)
class DecisaoNormalizada:
    """Decisao canonica para comparar: tupla decisao-codigo-valores."""

    decisao: str  # outcome ou "rejeitado"
    codigo: tuple[str, ...]  # reason codes (valido) ou campos da fronteira (invalido)
    valores: tuple[tuple[str, str], ...]  # intersecao serializada observavel nos dois lados

    def normalizada(self) -> DecisaoNormalizada:
        """Forma canonica ja aplicada na construcao; compara-se a tupla."""
        return self


class CaminhoDecisor(Protocol):
    """Contrato do consumidor: recebe entrada, devolve decisao normalizada."""

    def decidir(self, entrada: EntradaCorpus) -> DecisaoNormalizada: ...


def normalizar_decidida(request: WorkRequest, result: EvaluationResult) -> DecisaoNormalizada:
    """Normaliza a decisao decidida: mesma tupla nos dois caminhos."""
    valores = (
        ("request_id", request.request_id),
        ("outcome", result.decision.outcome.value),
        ("policy_version", result.decision.policy_version),
        ("contract_version", result.decision.contract_version),
        ("budget", format(request.budget, "f")),
    )
    return DecisaoNormalizada(
        decisao=result.decision.outcome.value,
        codigo=tuple(result.decision.reason_codes),
        valores=valores,
    )


def normalizar_rejeicao(campos: tuple[str, ...]) -> DecisaoNormalizada:
    """Normaliza a rejeicao tipada: o invalido compara por campos, nunca por texto."""
    return DecisaoNormalizada(decisao="rejeitado", codigo=tuple(sorted(campos)), valores=())


def normalizar_saida_cli(saida: dict[str, Any], *, orcamento_evidencia: str) -> DecisaoNormalizada:
    """Normaliza o stdout da CLI instalada para a mesma tupla da API em processo."""
    motivos = tuple(str(item) for item in saida["reason_codes"])
    valores = (
        ("request_id", str(saida["request_id"])),
        ("outcome", str(saida["outcome"])),
        ("policy_version", str(saida["policy_version"])),
        ("contract_version", str(saida["contract_version"])),
        ("budget", orcamento_evidencia),
    )
    return DecisaoNormalizada(decisao=str(saida["outcome"]), codigo=motivos, valores=valores)


def fidelidade_tipos(request: WorkRequest) -> tuple[tuple[str, str], ...]:
    """Fidelidade fina de tipos (AT-011 como heranca): mesma expectativa nos dois lados."""
    return (
        ("budget", format(request.budget, "f")),
        ("deadline_utc", request.deadline_at.astimezone(UTC).isoformat()),
        ("intent", request.intent.strip()),
        ("priority", request.priority.value),
        ("source", request.source or ""),
    )


def comparar_caminhos(
    entradas: Sequence[EntradaCorpus],
    api_em_processo: CaminhoDecisor,
    cli_instalada: CaminhoDecisor,
) -> None:
    """Comparacao diferencial (AT-006/010): normaliza antes de comparar, inclui invalidos."""
    for entrada in entradas:
        a = api_em_processo.decidir(entrada).normalizada()
        b = cli_instalada.decidir(entrada).normalizada()
        assert (a.decisao, a.codigo, a.valores) == (b.decisao, b.codigo, b.valores)


def extrair_campos_boundary(stderr: str) -> tuple[str, ...]:
    """Le os campos tipados da rejeicao da CLI (mesmo vocabulario da BoundaryError)."""
    match = re.search(r"revise: ([^\n]+)", stderr)
    if match is None:
        return ()
    return tuple(sorted(part.strip() for part in match.group(1).split(",") if part.strip()))


@dataclass(frozen=True, slots=True)
class ApiEmProcesso:
    """Caminho API: chamada de funcao no mesmo interpretador, sem texto no meio."""

    servico: EvaluateWorkRequest

    def decidir(self, entrada: EntradaCorpus) -> DecisaoNormalizada:
        try:
            pedido = parse_work_request_json(entrada.bruto)
        except BoundaryError as exc:
            return normalizar_rejeicao(exc.fields)
        resultado = self.servico.execute(pedido)
        return normalizar_decidida(pedido, resultado)


@dataclass(frozen=True, slots=True)
class CliInstalada:
    """Caminho CLI: ponto de entrada instalado em processo separado, fora do checkout."""

    python: str
    site: Path  # wheel extraido; unico codigo visivel via PYTHONPATH
    checkout: str  # source tree que nunca pode aparecer como origem
    cwd: Path  # diretorio de trabalho fora do checkout
    advisor: str = "fake"
    recording: Path | None = None

    def decidir(self, entrada: EntradaCorpus) -> DecisaoNormalizada:
        slug = "".join(c if c.isalnum() or c in "-_" else "-" for c in entrada.nome)[:40]
        with tempfile.TemporaryDirectory(
            prefix=f"b14l-{slug or 'entrada'}-", dir=str(self.cwd)
        ) as area:
            pedido_path = Path(area) / "pedido.json"
            banco_path = Path(area) / "cli.db"
            evidencia_path = Path(area) / "evidencia.json"
            pedido_path.write_text(entrada.bruto, encoding="utf-8")
            comando = [
                self.python,
                "-m",
                "work_intake.cli",
                "evaluate",
                str(pedido_path),
                "--database",
                str(banco_path),
                "--advisor",
                self.advisor,
            ]
            if self.recording is not None:
                comando += ["--recording", str(self.recording)]
            comando += ["--evidence", str(evidencia_path)]
            ambiente = dict(os.environ)
            ambiente["PYTHONPATH"] = str(self.site)
            ambiente.pop("PYTHONHOME", None)
            proc = subprocess.run(
                comando,
                check=False,
                capture_output=True,
                text=True,
                encoding="utf-8",
                cwd=str(self.cwd),
                env=ambiente,
                timeout=TIMEOUT_CLI_EXEMPLO_S,
            )
            if proc.returncode == 0:
                saida: dict[str, Any] = json.loads(proc.stdout)
                evidencia: dict[str, Any] = json.loads(evidencia_path.read_text(encoding="utf-8"))
                orcamento = str(evidencia["budget"]["request"])
                return normalizar_saida_cli(saida, orcamento_evidencia=orcamento)
            if proc.returncode == 2:
                return normalizar_rejeicao(extrair_campos_boundary(proc.stderr))
            raise RuntimeError(
                f"CLI instalada retornou {proc.returncode} fora do contrato: {proc.stderr.strip()}"
            )


def compor(
    *, servico: EvaluateWorkRequest, cli: CliInstalada
) -> tuple[ApiEmProcesso, CliInstalada]:
    """Composition root conceitual (ES26-054): consumidor recebe contrato, nunca concreto.

    O servico chega montado pela raiz real (``composition.build_evaluator``);
    esta funcao apenas liga os dois caminhos ao mesmo corpus sem importar
    nenhum adapter concreto.
    """
    return (ApiEmProcesso(servico=servico), cli)


def admitir_ou_recusar(
    *, capacidade: int, em_espera: int, ao_admitir: Callable[[], str]
) -> tuple[str, str]:
    """Recusa na admissao (ES26-055): fila limitada, a tarefa nem nasce.

    Sobrecarga e recusa explicita com motivo de capacidade e processo vivo;
    nada ha para limpar porque a operacao nunca foi criada.
    """
    if capacidade < 1:
        raise ValueError("capacidade deve ser positiva-exemplo")
    if em_espera < 0:
        raise ValueError("espera nao pode ser negativa-exemplo")
    if em_espera >= capacidade:
        return (CODIGO_SOBRECARGA_EXEMPLO, MOTIVO_SOBRECARGA_EXEMPLO)
    return (CODIGO_ADMITIDO_EXEMPLO, ao_admitir())


def _base_valida_v1(
    *, request_id: str, idempotency_key: str, orcamento: str, prioridade: str, intencao: str
) -> dict[str, str]:
    return {
        "schema_version": "1.0",
        "request_id": request_id,
        "tenant_id": "tenant-acme",
        "intent": intencao,
        "priority": prioridade,
        "budget": orcamento,
        "deadline_at": "2026-09-01T12:00:00Z",
        "idempotency_key": idempotency_key,
    }


def payload_valido_gerado(*, indice: int, orcamento: str, prioridade: str) -> dict[str, str]:
    """Variante valida deterministica: ids unicos, mesma forma da golden."""
    return _base_valida_v1(
        request_id=f"req-b14g-{indice:03d}",
        idempotency_key=f"idem-b14g-{indice:04d}-exemplo",
        orcamento=orcamento,
        prioridade=prioridade,
        intencao=f"Intencao gerada {indice}: revisar acao, seguranca e operacao.",
    )


PAYLOAD_GOLDEN_V1: Final[dict[str, str]] = {
    "schema_version": "1.0",
    "request_id": "req-onboard-001",
    "tenant_id": "tenant-acme",
    "intent": "Automatizar a revisão de documentação interna em português.",
    "priority": "normal",
    "budget": "750.00",
    "deadline_at": "2026-09-01T12:00:00Z",
    "idempotency_key": "idem-onboard-001",
}

PAYLOAD_GOLDEN_V2: Final[dict[str, str]] = {
    "schema_version": "2.0",
    "request_id": "req-onboard-002",
    "tenant_id": "tenant-acme",
    "intent": "Classificar solicitações recebidas por importação.",
    "priority": "normal",
    "budget": "900.50",
    "deadline_at": "2026-09-02T12:00:00+00:00",
    "idempotency_key": "idem-onboard-002",
    "source": "import",
}


def entrada_de_payload(nome: str, familia: str, payload: Mapping[str, object]) -> EntradaCorpus:
    """Serializa o payload como a fronteira o veria: JSON em texto, chaves ordenadas."""
    bruto = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return EntradaCorpus(nome=nome, bruto=bruto, esperado="valido", familia=familia)


def com_invalidez(
    familia: str, payload: dict[str, object]
) -> tuple[dict[str, object], tuple[str, ...]]:
    """Aplica uma invalidez por familia e declara os campos tipados esperados."""
    corrompido = dict(payload)
    if familia == "versao":
        corrompido["schema_version"] = "3.0"
        return (corrompido, ("schema_version",))
    if familia == "extra":
        corrompido["is_admin"] = True
        return (corrompido, ("is_admin",))
    if familia == "intent":
        corrompido["intent"] = "   "
        return (corrompido, ("intent",))
    if familia == "orcamento":
        corrompido["budget"] = "12.345"
        return (corrompido, ("budget",))
    if familia == "prazo-ausente":
        del corrompido["deadline_at"]
        return (corrompido, ("deadline_at",))
    if familia == "prazo-sem-tz":
        corrompido["deadline_at"] = "2026-09-01T12:00:00"
        return (corrompido, ("deadline_at",))
    if familia == "prioridade":
        corrompido["priority"] = "urgent"
        return (corrompido, ("priority",))
    if familia == "chave":
        corrompido["idempotency_key"] = "curta"
        return (corrompido, ("idempotency_key",))
    raise ValueError(f"familia invalida desconhecida-exemplo: {familia}")


def _entrada_invalida(nome: str, familia: str, base: Mapping[str, object]) -> EntradaCorpus:
    corrompido, _campos = com_invalidez(familia, dict(base))
    bruto = json.dumps(corrompido, ensure_ascii=False, sort_keys=True)
    return EntradaCorpus(nome=nome, bruto=bruto, esperado="invalido", familia=familia)


FAMILIAS_INVALIDAS_GOLDEN: Final[tuple[str, ...]] = (
    "versao",
    "extra",
    "intent",
    "orcamento",
    "prazo-ausente",
    "prazo-sem-tz",
    "prioridade",
    "chave",
)

CORPUS_GOLDEN_B14L: Final[tuple[EntradaCorpus, ...]] = (
    entrada_de_payload("golden-v1-valido", "valido", PAYLOAD_GOLDEN_V1),
    entrada_de_payload("golden-v2-valido", "valido", PAYLOAD_GOLDEN_V2),
    *tuple(
        _entrada_invalida(f"golden-invalido-{familia}", familia, PAYLOAD_GOLDEN_V1)
        for familia in FAMILIAS_INVALIDAS_GOLDEN
    ),
    EntradaCorpus(
        nome="golden-invalido-json", bruto="{nao-json", esperado="invalido", familia="json"
    ),
    EntradaCorpus(nome="golden-invalido-raiz", bruto="[1, 2]", esperado="invalido", familia="raiz"),
)

ORCAMENTOS_GERADOS_EXEMPLO: Final[tuple[str, ...]] = ("10.00", "999.99", "1000.01", "15000.00")
PRIORIDADES_GERADAS_EXEMPLO: Final[tuple[str, ...]] = ("low", "normal", "high", "critical")


def gerar_validos(seed: int, n: int) -> tuple[EntradaCorpus, ...]:
    """Amplia a cobertura com seed fixo; nao promete o espaco inteiro."""
    if n < 1:
        raise ValueError("geracao exige ao menos uma entrada-exemplo")
    rng = random.Random(seed)
    return tuple(
        entrada_de_payload(
            f"gerado-valido-{indice:03d}",
            "valido",
            payload_valido_gerado(
                indice=indice,
                orcamento=rng.choice(ORCAMENTOS_GERADOS_EXEMPLO),
                prioridade=rng.choice(PRIORIDADES_GERADAS_EXEMPLO),
            ),
        )
        for indice in range(n)
    )


def gerar_invalidos(seed: int, n: int) -> tuple[EntradaCorpus, ...]:
    """Invalidos gerados: uma familia por entrada, motivo declarado."""
    if n < 1:
        raise ValueError("geracao exige ao menos uma entrada-exemplo")
    familias = ("versao", "extra", "intent", "orcamento", "prazo-ausente", "prazo-sem-tz")
    rng = random.Random(seed + 1)
    entradas: list[EntradaCorpus] = []
    for indice in range(n):
        familia = familias[indice % len(familias)]
        base = payload_valido_gerado(
            indice=100 + indice,
            orcamento=rng.choice(ORCAMENTOS_GERADOS_EXEMPLO),
            prioridade="normal",
        )
        entradas.append(_entrada_invalida(f"gerado-invalido-{indice:03d}", familia, base))
    return tuple(entradas)


CORPUS_GERADO_B14L: Final[tuple[EntradaCorpus, ...]] = (
    *gerar_validos(SEED_B14L, N_GERADOS_VALIDOS_EXEMPLO),
    *gerar_invalidos(SEED_B14L, N_GERADOS_INVALIDOS_EXEMPLO),
)

CORPUS_B14L: Final[tuple[EntradaCorpus, ...]] = (*CORPUS_GOLDEN_B14L, *CORPUS_GERADO_B14L)


def digest_corpus(seed: int, entradas: Sequence[EntradaCorpus]) -> str:
    """Digest canonico do corpus (seed + entradas = evidencia recalculavel)."""
    canonico = json.dumps(
        {
            "seed": seed,
            "entradas": [[e.nome, e.bruto, e.esperado, e.familia] for e in entradas],
        },
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(canonico.encode("utf-8")).hexdigest()


DIGEST_B14L: Final[str] = digest_corpus(SEED_B14L, CORPUS_B14L)


def python_do_ambiente() -> str:
    """Interpretador corrente: a CLI instalada roda no mesmo runtime do teste."""
    return sys.executable
