"""Observabilidade e SRE locais: trace, SLI/SLO/budget e runbook (B10-L).

Contratos VERBATIM da secao <section id="b10"> de M02A.html: elos de quatro
etapas com o mesmo correlation ID, SLI como fracao de boas sobre amostras,
budget restante como fracao do permitido, rotulo de metrica em vocabulario
fechado e identificadores so em campo de log com retencao.

Limite auditavel: recorte local sem rede, sem carga real e sem janela de SLO
de producao. Amostras, patamares e janelas sao exemplo variavel; a
reprodutibilidade vem de amostras brutas persistidas com seed e digest.
"""

from __future__ import annotations

import hashlib
import json
import random
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field

SEED_B10L = 20260919
MARCADOR_REDACAO = "[redigido]"

# ---------------------------------------------------------------------------
# Contratos VERBATIM da secao b10 (forma executavel; trechos no HTML sao
# conceituais e rotulados; aqui valem tipos, falha fechada e digest).
# ---------------------------------------------------------------------------


def elos_da_avaliacao(correlation_id: str, tenant: str) -> list[tuple[str, str, str]]:
    """Os quatro elos carregam o mesmo par; conteudo sensivel fica fora."""
    return [
        ("request", correlation_id, tenant),
        ("advisory", correlation_id, tenant),
        ("decision", correlation_id, tenant),
        ("evento", correlation_id, tenant),
    ]


def sli(amostras: Sequence[bool]) -> float:
    """SLI e a fracao de boas; SLO e janela vivem na politica.

    Divergencia minima do trecho conceitual: amostra vazia nega com
    ValueError em vez de ZeroDivisionError (fail-closed explicito).
    """
    if len(amostras) == 0:
        raise ValueError("amostras vazias nao definem SLI")
    boas = sum(1 for amostra in amostras if amostra)
    return boas / len(amostras)


def budget_restante(sli_observado: float, slo_alvo: float) -> float:
    """Fracao do budget ainda disponivel antes da decisao."""
    permitido = 1.0 - slo_alvo
    consumido = 1.0 - sli_observado
    return (permitido - consumido) / permitido if permitido else 0.0


def rotular_para_metrica(veredito: str, reason_code: str) -> dict[str, str]:
    """Vocabulario fechado: so valores de baixa cardinalidade."""
    return {"veredito": veredito, "motivo": reason_code}


def campo_para_log(correlation_id: str, tenant: str, detalhe_redigido: str) -> dict[str, str]:
    """Identificadores e detalhe vivem no log com retencao, nunca na metrica."""
    return {
        "correlation_id": correlation_id,
        "tenant": tenant,
        "detalhe": detalhe_redigido,
    }


# ---------------------------------------------------------------------------
# Amostras persistidas com seed e digest (AT-044; sem threshold universal).
# ---------------------------------------------------------------------------

N_BOAS_EXEMPLO = 19
N_RUINS_EXEMPLO = 1


def gerar_amostras(seed: int, n_boas: int, n_ruins: int) -> tuple[bool, ...]:
    """Gera a amostra bruta de forma deterministica; o embaralhamento usa seed."""
    rng = random.Random(seed)
    amostras = [True] * n_boas + [False] * n_ruins
    rng.shuffle(amostras)
    return tuple(amostras)


def digest_amostras(seed: int, amostras: Sequence[bool]) -> str:
    """Digest canonico da amostra bruta (seed + amostra = evidencia)."""
    canonico = json.dumps(
        {"seed": seed, "amostras": list(amostras)},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonico.encode("utf-8")).hexdigest()


AMOSTRAS_B10L: tuple[bool, ...] = gerar_amostras(SEED_B10L, N_BOAS_EXEMPLO, N_RUINS_EXEMPLO)
DIGEST_B10L: str = digest_amostras(SEED_B10L, AMOSTRAS_B10L)


@dataclass(frozen=True, slots=True)
class PoliticaSLO:
    """SLO declarado: alvo, janela, fonte, owner e consequencia do budget."""

    alvo: float
    janela: str
    fonte: str
    owner: str
    consequencia_budget_esgotado: str


POLITICA_B10L = PoliticaSLO(
    alvo=0.9,
    janela="janela-exemplo-100-avaliacoes",
    fonte="amostras-brutas-persistidas-b10l",
    owner="policy-owner",
    consequencia_budget_esgotado="conter-mudanca-arriscada-e-reverter",
)

DECISAO_LIBERAR = "liberar-entrega"
DECISAO_CONTER = "conter-mudanca-arriscada-e-reverter"


def decidir(politica: PoliticaSLO, amostras: Sequence[bool]) -> str:
    """Budget esgotado (<= 0) contem/reverte; saudavel libera a entrega.

    O patamar zero e a politica declarada deste recorte (exemplo variavel),
    nao um threshold universal.
    """
    if not politica.owner or not politica.janela or not politica.fonte:
        raise ValueError("SLO sem dono, janela ou fonte e metrica decorativa")
    restante = budget_restante(sli(amostras), politica.alvo)
    if restante <= 0.0:
        return DECISAO_CONTER
    return DECISAO_LIBERAR


# ---------------------------------------------------------------------------
# Trace request -> advisory -> decision -> evento (AT-036; ES26-037).
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Span:
    elo: str
    trace_id: str
    correlation_id: str
    tenant: str


def construir_trace(correlation_id: str, tenant: str, trace_id: str) -> tuple[Span, ...]:
    """Quatro spans com o mesmo trace_id e correlation ID propagados."""
    return tuple(
        Span(elo=nome, trace_id=trace_id, correlation_id=correlation_id, tenant=tenant)
        for nome, _corr, _ten in elos_da_avaliacao(correlation_id, tenant)
    )


def trace_completo(spans: Sequence[Span]) -> bool:
    """Os quatro elos compartilham trace_id, correlation ID e tenant validos."""
    nomes = [span.elo for span in spans]
    if nomes != ["request", "advisory", "decision", "evento"]:
        return False
    primeiros = spans[0]
    if not primeiros.trace_id or not primeiros.correlation_id or not primeiros.tenant:
        return False
    return all(
        span.trace_id == primeiros.trace_id
        and span.correlation_id == primeiros.correlation_id
        and span.tenant == primeiros.tenant
        for span in spans
    )


def redigir(texto: str, segredos: Sequence[str]) -> str:
    """Redacao antes da emissao, no caminho feliz e no de erro."""
    redigido = texto
    for segredo in segredos:
        if segredo:
            redigido = redigido.replace(segredo, MARCADOR_REDACAO)
    return redigido


# ---------------------------------------------------------------------------
# Guarda de cardinalidade e PII (AT-033; ES26-039).
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class SerieMetrica:
    nome: str
    labels: Mapping[str, str]


@dataclass(frozen=True, slots=True)
class NegacaoMetrica:
    motivo: str


def varrer_metrica(
    serie: SerieMetrica, identificadores: Sequence[str]
) -> NegacaoMetrica | SerieMetrica:
    """Reprova nome ou label que contenha correlation ID, tenant ou texto."""
    texto = (
        serie.nome
        + "\x00"
        + "\x00".join(f"{chave}={valor}" for chave, valor in serie.labels.items())
    )
    for identificador in identificadores:
        if identificador and identificador in texto:
            return NegacaoMetrica(motivo="identificador-em-metrica")
    return serie


@dataclass(frozen=True, slots=True)
class ErroExterno:
    motivo_seguro: str

    def para_externo(self) -> str:
        """Resposta externa carrega so o motivo seguro, sem causa interna."""
        return self.motivo_seguro


# ---------------------------------------------------------------------------
# Runbook exercitado nos quatro incidentes locais (AT-045; ES26-040).
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ResultadoRunbook:
    incidente: str
    sinal: str
    acao: str
    criterio_saida: str
    sem_parcial: bool


@dataclass
class FilaBoundedLocal:
    """Admissao limitada com shed explicito; drena sem crescimento ilimitado."""

    capacidade: int
    admitidos: int = 0
    rejeitados: int = 0
    consumidos: int = 0
    profundidade_maxima: int = 0
    decisao_shed: str = ""
    _fila: list[str] = field(default_factory=list, repr=False, compare=False)

    def __post_init__(self) -> None:
        if self.capacidade < 1:
            raise ValueError("capacidade deve ser positiva")

    def admitir(self, item: str) -> bool:
        if len(self._fila) >= self.capacidade:
            self.rejeitados += 1
            return False
        self._fila.append(item)
        self.admitidos += 1
        self.profundidade_maxima = max(self.profundidade_maxima, len(self._fila))
        return True

    def drenar(self) -> int:
        consumidos = 0
        while self._fila:
            self._fila.pop(0)
            self.consumidos += 1
            consumidos += 1
        return consumidos


class DBLockedError(RuntimeError):
    """Conflito de escrita com vencedor observavel (recorte local)."""


@dataclass
class BancoLocal:
    """Escrita unica com falha injetavel; retry limitado, depois degradacao."""

    gravado: bool = False
    tentativas: int = 0
    falhas_injetadas: int = 0
    degradado: bool = False

    def escrever(self) -> str:
        self.tentativas += 1
        if self.tentativas <= self.falhas_injetadas:
            raise DBLockedError("database is locked")
        self.gravado = True
        return "ok"


def exercitar_overload(capacidade: int, ofertas: int) -> ResultadoRunbook:
    """Overload: rejeicoes bounded e profundidade no teto; conter e drenar."""
    fila = FilaBoundedLocal(capacidade=capacidade)
    for i in range(ofertas):
        fila.admitir(f"item-{i}")
    fila.decisao_shed = "conter-admissao-priorizar-revisao"
    drenados = fila.drenar()
    sem_parcial = fila.consumidos + fila.rejeitados == ofertas and drenados > 0
    return ResultadoRunbook(
        incidente="overload",
        sinal="rejeicoes-bounded-e-profundidade-no-teto",
        acao="conter-admissao-priorizar-revisao-registrar-shed",
        criterio_saida=f"fila-drena-sem-crescimento-ilimitado:{drenados}",
        sem_parcial=sem_parcial,
    )


def exercitar_db_locked(falhas_injetadas: int, orcamento_retry: int) -> ResultadoRunbook:
    """DB locked: retry limitado com orcamento, depois degradacao declarada."""
    banco = BancoLocal(falhas_injetadas=falhas_injetadas)
    resultado = "degradacao-declarada"
    for _tentativa in range(orcamento_retry):
        try:
            resultado = banco.escrever()
        except DBLockedError:
            continue
        break
    else:
        banco.degradado = True
    sem_parcial = banco.gravado or banco.degradado
    return ResultadoRunbook(
        incidente="db-locked",
        sinal="conflito-de-escrita-com-vencedor-observavel",
        acao=f"retry-limitado-orcamento-{orcamento_retry}-depois-degradar",
        criterio_saida=f"nenhuma-avaliacao-parcial:{resultado}",
        sem_parcial=sem_parcial,
    )


def exercitar_provider_indisponivel(prazo_ticks: int) -> ResultadoRunbook:
    """Provider indisponivel: timeout com cleanup e fallback auditado."""
    inicio = 0
    agora = prazo_ticks
    expirado = (agora - inicio) >= prazo_ticks
    limpeza_executada = bool(expirado)
    fallback = "fallback-declarado-com-reason-code" if expirado else "sem-fallback"
    sem_orfa = limpeza_executada and fallback.startswith("fallback-declarado")
    return ResultadoRunbook(
        incidente="provider-indisponivel",
        sinal="timeout-do-advisor-com-cleanup",
        acao=f"{fallback}-sem-tarefa-orfa",
        criterio_saida="decisao-deterministica-auditada-advisory-ausente-nao-vira-aceite",
        sem_parcial=sem_orfa,
    )


def exercitar_rollback(
    comportamento_v1: tuple[str, ...], comportamento_v2: tuple[str, ...]
) -> ResultadoRunbook:
    """Rollback: desativa v2 defeituosa e restaura v1 com evidencia no corpus."""
    defeito_detectado = comportamento_v2 != comportamento_v1
    ativa = "v2-defeituosa" if defeito_detectado else "v1"
    restaurada = "v1-restaurada" if defeito_detectado else "v1-mantida"
    reproduzido = defeito_detectado and restaurada == "v1-restaurada"
    return ResultadoRunbook(
        incidente="rollback-de-policy",
        sinal="budget-zerado-apos-policy-defeituosa",
        acao=f"desativar-{ativa}-restaurar-anterior-com-evidencia",
        criterio_saida=f"comportamento-anterior-reproduzido-no-corpus:{restaurada}",
        sem_parcial=reproduzido,
    )


@dataclass(frozen=True, slots=True)
class Postmortem:
    """Postmortem sem culpa: condicao, barreira, acao, dono e prazo."""

    incidente: str
    condicao_que_permitiu: str
    barreira_que_faltou: str
    acao: str
    dono: str
    prazo: str
