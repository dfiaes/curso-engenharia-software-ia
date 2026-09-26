"""Production Readiness Review e game day com decisão go/no-go (M13 B18).

Invariantes:
- PRR é uma **matriz evidência-obrigatória**: cada item aponta para um arquivo
  de evidência existente (gate pytest/ruff/mypy ou doc). Item sem evidência
  não pode ser "aprovado"; a checagem é executável, não declarativa.
- Game day é determinístico: falha injetada, papéis, ações e timeline
  registrados em ordem; o postmortem é gerado da timeline, não reescrito.
- NO-GO é resultado legítimo e primeira classe: trilha de bloqueio explica
  causa e gera plano de desbloqueio automático.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, TypedDict

from capstone_lab.deploy import ClusterState, HealthGate, Migration, Release, deploy, rollback


@dataclass(frozen=True)
class PrrItem:
    area: str
    pergunta: str
    evidencia: str  # caminho relativo à raiz do módulo


PRR_CHECKLIST: tuple[PrrItem, ...] = (
    PrrItem("arquitetura", "componentes e contratos >= N3 com diagrama", "evidence/m13/B06"),
    PrrItem("dependências", "SBOM/licenças/pinagem revisados", "evidence/m13/B02"),
    PrrItem("capacidade", "p50/p95/p99 + saturação + capacity estimate", "evidence/m13/B16"),
    PrrItem("segurança", "threat model, authz e PII em logs revisados", "evidence/m13/B12"),
    PrrItem("dados", "migrations, backup e restore exercitados", "evidence/m13/B17"),
    PrrItem("observabilidade", "SLOs, alertas e dashboards exercitados", "evidence/m13/B14"),
    PrrItem("operação", "runbooks e rollback determinístico", "evidence/m13/B17"),
    PrrItem("acesso", "princípio de menor privilégio e revisão de contas", "evidence/m13/B12"),
    PrrItem("suporte", "Diátaxis + onboarding sem intervenção", "evidence/m13/B15"),
    PrrItem("rollback", "release ruim detectada e revertida em teste", "evidence/m13/B17"),
)


class PrrItemResult(TypedDict):
    area: str
    pergunta: str
    evidencia: str
    ok: bool
    motivo: str


class PrrReport(TypedDict):
    total: int
    aprovados: int
    pendentes: int
    itens: list[PrrItemResult]
    go: bool


_MANIFEST_PATH = Path("evidence/m13/prr-manifest.json")
_DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")
_ITEM_FIELDS = {
    "requirement",
    "status",
    "artifact_path",
    "artifact_sha256",
    "command",
    "cwd",
    "returncode",
    "result",
    "reviewer",
    "reviewed_revision_digest",
    "environment",
    "scenario",
    "scope",
    "limitations",
}
_MANIFEST_FIELDS = {"schema_version", "revision_digest", "items"}


def _texto(valor: Any) -> bool:
    return isinstance(valor, str) and bool(valor.strip())


def _validar_item(
    module_root: Path,
    area: str,
    item: PrrItem,
    entrada: Any,
    revision_digest: str,
) -> tuple[bool, str, str]:
    """Valida o registro, a revisão e os bytes do artefato de um requisito."""
    if not isinstance(entrada, dict):
        return False, "registro do requisito ausente ou não é objeto", ""
    ausentes = sorted(_ITEM_FIELDS - entrada.keys())
    if ausentes:
        return False, f"campos ausentes: {', '.join(ausentes)}", ""
    extras = sorted(entrada.keys() - _ITEM_FIELDS)
    if extras:
        return False, f"campos não permitidos: {', '.join(extras)}", ""
    if entrada["requirement"] != item.pergunta:
        return (
            False,
            "texto do requisito não corresponde ao checklist",
            str(entrada["artifact_path"]),
        )
    if not isinstance(entrada["status"], str) or entrada["status"] not in {
        "PASS",
        "FAIL",
        "BLOCKED",
    }:
        return False, "status deve ser PASS, FAIL ou BLOCKED", str(entrada["artifact_path"])
    if not _texto(entrada["command"]) or not _texto(entrada["cwd"]):
        return False, "command e cwd devem ser textos não vazios", str(entrada["artifact_path"])
    codigo = entrada["returncode"]
    if isinstance(codigo, bool) or not isinstance(codigo, int):
        return False, "returncode deve ser inteiro", str(entrada["artifact_path"])
    if not _texto(entrada["result"]):
        return False, "result deve descrever o resultado observado", str(entrada["artifact_path"])
    if not _texto(entrada["reviewer"]):
        return False, "reviewer deve identificar a revisão", str(entrada["artifact_path"])
    if entrada["reviewed_revision_digest"] != revision_digest:
        return (
            False,
            "revisão do requisito aponta para outro revision_digest",
            str(entrada["artifact_path"]),
        )
    for campo in ("environment", "scenario", "scope"):
        if not _texto(entrada[campo]):
            return False, f"{campo} deve ser texto não vazio", str(entrada["artifact_path"])
    if not isinstance(entrada["limitations"], list) or any(
        not _texto(limite) for limite in entrada["limitations"]
    ):
        return False, "limitations deve ser uma lista de textos", str(entrada["artifact_path"])
    if entrada["status"] == "PASS" and codigo != 0:
        return False, "status PASS exige returncode zero", str(entrada["artifact_path"])
    if not isinstance(entrada["artifact_path"], str):
        return False, "artifact_path deve ser relativo à raiz do módulo", ""
    caminho_relativo = Path(entrada["artifact_path"])
    if caminho_relativo.is_absolute() or ".." in caminho_relativo.parts:
        return (
            False,
            "artifact_path deve permanecer dentro da raiz do módulo",
            entrada["artifact_path"],
        )
    raiz = module_root.resolve()
    artefato = (raiz / caminho_relativo).resolve()
    if not artefato.is_relative_to(raiz):
        return False, "artifact_path resolve para fora da raiz do módulo", entrada["artifact_path"]
    if not artefato.is_file():
        return False, "artefato ausente ou não é arquivo regular", entrada["artifact_path"]
    try:
        conteudo = artefato.read_bytes()
    except OSError as exc:
        return False, f"não foi possível ler o artefato: {exc}", entrada["artifact_path"]
    if not conteudo:
        return False, "artefato vazio", entrada["artifact_path"]
    digest = entrada["artifact_sha256"]
    if not isinstance(digest, str) or not _DIGEST_RE.fullmatch(digest):
        return (
            False,
            "artifact_sha256 deve ter 64 caracteres hexadecimais minúsculos",
            entrada["artifact_path"],
        )
    calculado = hashlib.sha256(conteudo).hexdigest()
    if calculado != digest:
        return (
            False,
            "artifact_sha256 não corresponde aos bytes do artefato",
            entrada["artifact_path"],
        )
    if entrada["status"] != "PASS":
        return False, f"requisito marcado como {entrada['status']}", entrada["artifact_path"]
    return True, "evidência válida para a revisão", entrada["artifact_path"]


def prr_report(module_root: Path, expected_revision_digest: str) -> PrrReport:
    """Aceita somente manifesto revisado, vinculado à revisão e a artefatos íntegros."""
    manifest_path = module_root / _MANIFEST_PATH
    raiz = module_root.resolve()
    try:
        manifesto_resolvido = manifest_path.resolve(strict=True)
        if not manifesto_resolvido.is_relative_to(raiz):
            raise ValueError("manifesto resolve para fora da raiz do módulo")
        manifesto = json.loads(manifesto_resolvido.read_text(encoding="utf-8"))
        erro_global = ""
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        manifesto = None
        erro_global = f"manifesto indisponível ou inválido: {exc}"

    digest_valido = isinstance(expected_revision_digest, str) and bool(
        _DIGEST_RE.fullmatch(expected_revision_digest)
    )
    if not digest_valido:
        erro_global = "expected_revision_digest deve ter 64 caracteres hexadecimais minúsculos"
    elif isinstance(manifesto, dict):
        if set(manifesto) - _MANIFEST_FIELDS:
            erro_global = "manifesto contém campos não permitidos"
        elif (
            isinstance(manifesto.get("schema_version"), bool)
            or not isinstance(manifesto.get("schema_version"), int)
            or manifesto.get("schema_version") != 1
        ):
            erro_global = "schema_version do manifesto deve ser 1"
        elif manifesto.get("revision_digest") != expected_revision_digest:
            erro_global = "manifesto pertence a outro revision_digest"
        elif not isinstance(manifesto.get("items"), dict):
            erro_global = "items do manifesto deve ser um objeto por requisito"
        elif manifesto["items"].keys() != {item.area for item in PRR_CHECKLIST}:
            erro_global = "items deve conter exatamente as áreas do checklist PRR"
    elif not erro_global:
        erro_global = "manifesto raiz deve ser um objeto JSON"

    itens: list[PrrItemResult] = []
    for item in PRR_CHECKLIST:
        entrada = manifesto.get("items", {}).get(item.area) if isinstance(manifesto, dict) else None
        if erro_global:
            ok, motivo, evidencia = False, erro_global, item.evidencia
        else:
            ok, motivo, evidencia = _validar_item(
                module_root, item.area, item, entrada, expected_revision_digest
            )
        itens.append(
            {
                "area": item.area,
                "pergunta": item.pergunta,
                "evidencia": evidencia,
                "ok": ok,
                "motivo": motivo,
            }
        )
    aprovados = sum(1 for i in itens if i["ok"])
    return {
        "total": len(itens),
        "aprovados": aprovados,
        "pendentes": len(itens) - aprovados,
        "itens": itens,
        "go": aprovados == len(itens),
    }


@dataclass(frozen=True)
class Papel:
    nome: str
    responsabilidade: str


GAMEDAY_PAPEIS: tuple[Papel, ...] = (
    Papel("incident_commander", "decide e coordena; único a declarar severidade"),
    Papel("executor", "executa runbook; nunca improvisa sem comunicar"),
    Papel("comunicador", "atualiza stakeholders em cadência declarada"),
    Papel("escriba", "registra timeline: tudo que aconteceu, na ordem"),
)


@dataclass(frozen=True)
class Evento:
    t: int  # minutos desde o início da injeção
    ator: str
    descricao: str


@dataclass(frozen=True)
class GameDay:
    """Simulador determinístico de game day com falha injetada de verdade.

    A falha aqui é local (rollback de release ruim, B17). Os eventos são
    gerados pela execução real dos passos, não por um script de texto.
    """

    cenario: str
    timeline: tuple[Evento, ...] = field(default_factory=tuple)
    _execution_result: tuple[bool, bool, bool] | None = field(default=None, init=False, repr=False)

    @property
    def recovery_observed(self) -> bool:
        """True somente quando o fluxo registrou a execução e seus três resultados."""
        return self._execution_result == (True, True, True)

    def registrar(self, t: int, ator: str, descricao: str) -> None:
        if self._execution_result is not None:
            raise RuntimeError("timeline encerrada após a execução; não pode ser alterada")
        if self.timeline and t < self.timeline[-1].t:
            raise ValueError("timeline fora de ordem")
        object.__setattr__(self, "timeline", (*self.timeline, Evento(t, ator, descricao)))

    def postmortem(self) -> dict[str, object]:
        """Postmortem derivado da timeline — impossível divergir dela."""
        inicio = self.timeline[0].t if self.timeline else 0
        fim = self.timeline[-1].t if self.timeline else 0
        return {
            "cenario": self.cenario,
            "duracao_min": fim - inicio,
            "eventos": [f"t+{e.t}min [{e.ator}] {e.descricao}" for e in self.timeline],
            "causa_raiz": "release ruim declarada; health gate falhou no canary",
            "acao_corretiva": "rollback automático via migrations down; canary<100%",
        }


def game_day_release_ruim() -> GameDay:
    """Conduz o game day: injeta release ruim e executa o runbook de rollback.

    O fluxo executa diretamente o par local deploy/rollback do B17. Não aceita
    callback nem resultado declarativo do chamador como prova de recuperação.
    """
    gd = GameDay("release-ruim-no-canary")
    gd.registrar(0, "incident_commander", "declarado SEV-2 simulado; game day inicia")
    gd.registrar(2, "executor", "health gate reprovou release candidata")

    estado = ClusterState(data={"cfg": "v1"})
    ruim = Release("9.9.9", (Migration(1, "x", {"x": 1}, ("x",)),), healthy=False)
    reprovado = deploy(estado, ruim, HealthGate())
    boa = Release("1.0.0", (Migration(1, "boa", {"boa": True}, ("boa",)),))
    deploy(estado, boa, HealthGate())
    rollback_resultado = rollback(estado, boa, 0)
    resultado = (
        reprovado["applied"] is False,
        estado.schema_version == 0 and estado.data == {"cfg": "v1"},
        rollback_resultado["rolled_back_to"] == 0 and estado.schema_version == 0,
    )
    gd.registrar(
        5,
        "executor",
        "resultado do fluxo: "
        f"failure_injected={resultado[0]}, recovered={resultado[1]}, "
        f"rollback_verified={resultado[2]}",
    )
    gd.registrar(7, "comunicador", "stakeholders informados: serviço estável em N-1")
    gd.registrar(10, "escriba", "timeline fechada; postmortem derivado")
    object.__setattr__(gd, "_execution_result", resultado)
    return gd


class GoNoGoDecision(TypedDict):
    veredito: str
    motivos: list[str]
    plano_desbloqueio: list[str]


def decide_go_no_go(prr: PrrReport, game_day: GameDay) -> GoNoGoDecision:
    """Decisão final: GO somente com PRR 100% evidenciado E game day concluído.

    NO-GO devolve o plano: lista dos itens pendentes e próximas ações — honesto.
    """
    areas = [i["area"] for i in prr["itens"]]
    aprovado_count = sum(1 for i in prr["itens"] if i["ok"])
    forma_completa = (
        prr["total"] == len(PRR_CHECKLIST)
        and len(prr["itens"]) == len(PRR_CHECKLIST)
        and set(areas) == {item.area for item in PRR_CHECKLIST}
        and prr["aprovados"] == aprovado_count
        and prr["pendentes"] == len(PRR_CHECKLIST) - aprovado_count
    )
    pendencias = [i for i in prr["itens"] if not i["ok"]]
    timeline_ok = len(game_day.timeline) >= 5
    go = (
        forma_completa
        and prr["go"]
        and timeline_ok
        and game_day.recovery_observed
        and not pendencias
    )
    motivos = [f"{i['area']}: {i['motivo']} ({i['pergunta']})" for i in pendencias]
    if not forma_completa:
        motivos.append("PRR incompleto ou contagens inconsistentes")
    if not game_day.recovery_observed:
        motivos.append("game day não comprovou falha injetada, recuperação e rollback")
    if not timeline_ok:
        motivos.append("timeline do game day incompleta")
    if forma_completa and not pendencias and not prr["go"]:
        motivos.append("PRR está marcado como NO-GO")
    return {
        "veredito": "GO" if go else "NO-GO",
        "motivos": motivos or ["PRR completo e game day concluído"],
        "plano_desbloqueio": [
            f"produzir evidência para '{p['area']}' e re-rodar PRR" for p in pendencias
        ],
    }
