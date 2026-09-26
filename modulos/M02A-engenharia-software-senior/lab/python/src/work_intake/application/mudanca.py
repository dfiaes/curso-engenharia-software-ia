"""Mudanca incremental, entrega e reversibilidade locais (B12-L).

Contratos VERBATIM da secao <section id="b12"> de M02A.html: fatia pequena
com risco, reversibilidade e rollback declarados antes de integrar
(avaliar_mudanca libera, contem ou bloqueia); legado por costura observavel
com corpus golden, strangler que desvia aos poucos e expand-contract que
nunca salta sem volta; build, release, deploy e operacao como fases
distintas com flag que separa instalacao de exposicao e rollback que
desativa a v2 defeituosa e restaura a v1 observada (AT-039); gate unico
cross-platform e offline com manifesto recalculavel (AT-040 a AT-043);
DORA lida como sistema, nunca como ranking.

Limite auditavel: recorte local sem rede, sem Docker, sem PostgreSQL,
sem broker e sem provedor real. Dado escrito pela v2 antes do rollback
continua existindo e precisa de plano proprio: reversibilidade de decisao
nao equivale a reversao de dado. Numeros de fatias, janelas, percentuais e
patamares sao exemplo variavel: a reprodutibilidade vem de seed, amostra
bruta e digest, nunca do numero impresso.
"""

from __future__ import annotations

import hashlib
import json
import random
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import PurePosixPath, PureWindowsPath
from typing import Final, Literal

SEED_B12L: Final[int] = 20260921
VERSAO_ATIVA_EXEMPLO: Final[str] = "v2"
PERCENTUAL_FATIA_EXEMPLO: Final[float] = 10.0
JANELA_OBSERVACAO_EXEMPLO: Final[str] = "janela-exemplo-24h"
COMMIT_EXEMPLO: Final[str] = "commit-exemplo-b12l"
SO_EXEMPLO: Final[str] = "linux-exemplo"

LIMITACOES_B12L: Final[tuple[str, ...]] = (
    "recorte local sem rede, Docker, PostgreSQL, broker ou provedor real",
    "flag desliga comportamento; dado escrito pela v2 precisa de plano proprio",
    "gate unico: mesma suite em Windows e Linux, offline e sem credencial",
    "numeros sao exemplo variavel: validos para seed/amostra/digest acima",
)

Risco = Literal["baixo", "alto"]
DecisaoMudanca = Literal["liberar", "conter", "bloqueada"]
VersaoPolicy = Literal["v1", "v2"]
DecisaoEntrega = Literal["manter", "conter-rollout", "reordenar-fatias", "reforcar-gate"]

PASSOS_B12L: Final[tuple[str, ...]] = (
    "abrir-costura",
    "provar-equivalencia",
    "desviar-fatia",
    "contrair-velho",
)


# ---------------------------------------------------------------------------
# Gate de mudanca por risco, reversibilidade e rollback (ES26-045).
# ---------------------------------------------------------------------------


def avaliar_mudanca(*, risco: str, reversivel: bool, rollback_descrito: bool) -> str:
    """Gate conceitual do bloco em forma executavel: libera, contem ou bloqueia."""
    if risco not in ("baixo", "alto"):
        raise ValueError("risco deve ser 'baixo' ou 'alto'")
    if not reversivel or not rollback_descrito:
        return "bloqueada"
    if risco == "alto":
        return "conter"
    return "liberar"


@dataclass(frozen=True, slots=True)
class Fatia:
    """Fatia pequena com os quatro campos que a revisao precisa ler."""

    motivo: str
    risco: str
    reversivel: bool
    rollback_descrito: bool
    owner: str
    trigger_revisao: str


def porta_de_mudanca(fatia: Fatia) -> str:
    """Fatia sem owner ou sem trigger falha no gate como irreversivel sem volta."""
    if not fatia.motivo or not fatia.owner or not fatia.trigger_revisao:
        return "bloqueada"
    return avaliar_mudanca(
        risco=fatia.risco,
        reversivel=fatia.reversivel,
        rollback_descrito=fatia.rollback_descrito,
    )


# ---------------------------------------------------------------------------
# Legado incremental: costura, strangler e expand-contract (ES26-046).
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Costura:
    """Ponto de mudanca isolado atras de interface com teste fixando o antes."""

    nome: str
    com_corpus: bool


def abrir_costura(nome: str, *, com_corpus_golden: bool) -> Costura:
    """Sem costura com teste, modernizar e editar as cegas: nega sem corpus."""
    if not nome:
        raise ValueError("costura exige nome declarado")
    if not com_corpus_golden:
        raise ValueError("costura exige corpus golden fixando o antes")
    return Costura(nome=nome, com_corpus=True)


@dataclass(frozen=True, slots=True)
class RotaStrangler:
    """Rota nova atende parte; a legada segue viva como padrao ate secar."""

    legada: str
    nova: str
    percentual_nova: float


def desviar_rota(legada: str, nova: str, *, percentual_nova: float) -> RotaStrangler:
    """Desvia o trafego aos poucos; desligar a legada antes da prova invalida."""
    if not legada or not nova:
        raise ValueError("strangler exige rota legada e rota nova nomeadas")
    if not 0.0 <= percentual_nova <= 100.0:
        raise ValueError("percentual da fatia deve estar em [0, 100]")
    return RotaStrangler(legada=legada, nova=nova, percentual_nova=percentual_nova)


def atendida_por_nova(*, semente: int, indice: int, percentual_nova: float) -> bool:
    """Sorteio deterministico por indice: mesma semente, mesmo roteamento."""
    if not 0.0 <= percentual_nova <= 100.0:
        raise ValueError("percentual da fatia deve estar em [0, 100]")
    if indice < 0:
        raise ValueError("indice do pedido nao pode ser negativo")
    sorteio = random.Random(semente + indice).random() * 100.0
    return sorteio < percentual_nova


def expandir_contrato(aceitas: frozenset[str], nova_versao: str) -> frozenset[str]:
    """Expandir aceita o novo sem quebrar o velho: uniao, nunca remocao."""
    if not nova_versao:
        raise ValueError("expansao exige nova versao declarada")
    return aceitas | frozenset({nova_versao})


def contrair_contrato(
    aceitas: frozenset[str],
    remover: str,
    consumidores: Mapping[str, str],
) -> frozenset[str]:
    """Contrair so apos todo consumidor declarar a versao nova."""
    if remover not in aceitas:
        raise ValueError("contração exige versao ainda aceita")
    presos = sorted(nome for nome, versao in consumidores.items() if versao == remover)
    if presos:
        raise ValueError(f"consumidores ainda na versao removida: {presos}")
    return aceitas - frozenset({remover})


def plano_incremental(passos: Sequence[str]) -> tuple[str, ...]:
    """Ordem honesta: costura, equivalencia, desvio e contracao, cada um reversivel."""
    if tuple(passos) != PASSOS_B12L:
        raise ValueError(f"plano deve seguir a ordem {list(PASSOS_B12L)}")
    return PASSOS_B12L


# ---------------------------------------------------------------------------
# Build, release, deploy, operacao, flag e rollback (ES26-047; AT-039).
# ---------------------------------------------------------------------------


def decidir_policy(versao_ativa: str, v2_saudavel: bool) -> str:
    """Flag conceitual do bloco: v2 defeituosa desativa e v1 restaura (AT-039)."""
    if versao_ativa not in ("v1", "v2"):
        raise ValueError("versao_ativa deve ser 'v1' ou 'v2'")
    if versao_ativa == "v2" and not v2_saudavel:
        return "v1"
    return versao_ativa


PEDIDOS_B12L: Final[tuple[str, ...]] = ("ped-exemplo-01", "ped-exemplo-02", "ped-exemplo-03")
VEREDITOS_V1_B12L: Final[dict[str, str]] = {
    "ped-exemplo-01": "accept-exemplo",
    "ped-exemplo-02": "review-exemplo",
    "ped-exemplo-03": "reject-exemplo",
}
VEREDITOS_V2_DEFEITUOSA_B12L: Final[dict[str, str]] = {
    "ped-exemplo-01": "accept-exemplo",
    "ped-exemplo-02": "accept-exemplo-defeituoso",
    "ped-exemplo-03": "reject-exemplo",
}


def avaliar_pedido(versao: str, pedido_id: str) -> str:
    """Veredito observado por versao de policy no corpus exemplo."""
    if versao == "v1":
        tabela = VEREDITOS_V1_B12L
    elif versao == "v2":
        tabela = VEREDITOS_V2_DEFEITUOSA_B12L
    else:
        raise ValueError("versao deve ser 'v1' ou 'v2'")
    try:
        return tabela[pedido_id]
    except KeyError as exc:
        raise ValueError(f"pedido fora do corpus exemplo: {pedido_id!r}") from exc


def avaliar_corpus(versao: str) -> tuple[tuple[str, str], ...]:
    """Restauração observada no corpus, nao intencao declarada."""
    return tuple((pedido, avaliar_pedido(versao, pedido)) for pedido in PEDIDOS_B12L)


def expor_por_flag(*, instalado: bool, flag_ligada: bool) -> bool:
    """Deploy instala; so a operacao por flag expoe o comportamento novo."""
    return instalado and flag_ligada


def pode_reverter(*, migracao_destrutiva: bool, rollback_descrito: bool) -> bool:
    """Volta que exige cirurgia em dado nao e reversivel: o gate deveria bloquear."""
    return rollback_descrito and not migracao_destrutiva


# ---------------------------------------------------------------------------
# Manifesto da mudanca auditavel (AT-043; forma executavel do trecho do bloco).
# ---------------------------------------------------------------------------


def registrar_mudanca(
    manifesto: list[dict[str, str]], *, commit: str, so: str, semente: str, digest: str
) -> list[dict[str, str]]:
    """Manifesto conceitual do bloco: fixa quem, onde e com o que."""
    if not commit or not so or not semente or not digest:
        raise ValueError("manifesto exige commit, so, semente e digest nao vazios")
    manifesto.append({"commit": commit, "so": so, "semente": semente, "digest": digest})
    return manifesto


@dataclass(frozen=True, slots=True)
class EntradaManifesto:
    """Manifesto completo do gate: commit, OS, runtimes, versoes, seeds, digests e duracoes."""

    commit: str
    so: str
    runtimes: tuple[str, ...]
    versoes: dict[str, str] = field(default_factory=dict)
    seeds: dict[str, int] = field(default_factory=dict)
    digests: dict[str, str] = field(default_factory=dict)
    duracoes_s: dict[str, float] = field(default_factory=dict)


def montar_manifesto(
    *,
    commit: str,
    so: str,
    runtimes: Sequence[str],
    versoes: Mapping[str, str],
    seeds: Mapping[str, int],
    digests: Mapping[str, str],
    duracoes_s: Mapping[str, float],
) -> dict[str, object]:
    """Monta o registro auditavel; campo ausente ou vazio nega (fail-closed)."""
    if not commit or not so:
        raise ValueError("manifesto exige commit e sistema operacional")
    if len(tuple(runtimes)) == 0 or len(dict(versoes)) == 0:
        raise ValueError("manifesto exige runtimes e versoes declarados")
    if len(dict(seeds)) == 0 or len(dict(digests)) == 0 or len(dict(duracoes_s)) == 0:
        raise ValueError("manifesto exige seeds, digests e duracoes")
    for duracao in dict(duracoes_s).values():
        if duracao < 0.0:
            raise ValueError("duracao do manifesto nao pode ser negativa")
    return {
        "commit": commit,
        "so": so,
        "runtimes": list(runtimes),
        "versoes": dict(versoes),
        "seeds": dict(seeds),
        "digests": dict(digests),
        "duracoes_s": dict(duracoes_s),
    }


def digest_manifesto(entrada: Mapping[str, object]) -> str:
    """Digest canonico do manifesto: evidencia sem digest recalculavel invalida."""
    canonico = json.dumps(entrada, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonico.encode("utf-8")).hexdigest()


def verificar_manifesto(entrada: Mapping[str, object], digest: str) -> bool:
    """Confere se o manifesto apresentado corresponde ao digest declarado."""
    return digest_manifesto(entrada) == digest


MANIFESTO_B12L: Final[dict[str, object]] = montar_manifesto(
    commit=COMMIT_EXEMPLO,
    so=SO_EXEMPLO,
    runtimes=("cpython-3.14-exemplo",),
    versoes={"work-intake": "0.1.0-exemplo", "policy": "v1-exemplo"},
    seeds={"b12l": SEED_B12L},
    digests={"corpus": "digest-exemplo-b12l"},
    duracoes_s={"suite_exemplo_s": 0.61},
)
DIGEST_B12L: Final[str] = digest_manifesto(MANIFESTO_B12L)


# ---------------------------------------------------------------------------
# Portabilidade Windows/Linux (AT-041): newline, casing e paths.
# ---------------------------------------------------------------------------


def normalizar_newline(texto: str) -> str:
    """Quebras de linha passam nas duas plataformas: CRLF/CR viram LF."""
    return texto.replace("\r\n", "\n").replace("\r", "\n")


def normalizar_casing(codigo: str) -> str:
    """Caixa de texto passa nas duas plataformas: dobra canonica sem espaco."""
    normalizado = codigo.casefold().strip()
    if not normalizado:
        raise ValueError("codigo vazio nao define casing")
    return normalizado


def nomes_equivalentes(caminho_win: str, caminho_posix: str) -> bool:
    """Mesmo arquivo logico nas duas plataformas: nomes finais iguais apos dobra."""
    if not caminho_win or not caminho_posix:
        raise ValueError("portabilidade exige os dois caminhos declarados")
    nome_win = PureWindowsPath(caminho_win).name.casefold()
    nome_posix = PurePosixPath(caminho_posix).name.casefold()
    return bool(nome_win) and nome_win == nome_posix


# ---------------------------------------------------------------------------
# Offline sem credencial (AT-042): sem rede no caminho obrigatorio.
# ---------------------------------------------------------------------------

IMPORTS_PROIBIDOS_B12L: Final[tuple[str, ...]] = (
    "socket",
    "ssl",
    "urllib",
    "http.client",
    "requests",
)


def sem_import_proibido(origem: str) -> bool:
    """A suite obrigatoria nao baixa recurso na hora do gate: so varre imports reais."""
    for linha in origem.splitlines():
        cortada = linha.strip()
        if (cortada.startswith("import ") or cortada.startswith("from ")) and any(
            proibido in cortada for proibido in IMPORTS_PROIBIDOS_B12L
        ):
            return False
    return True


def exigir_contexto_sem_credencial(variaveis: Mapping[str, str]) -> None:
    """Credencial presente no ambiente nao pode ser requisito do caminho."""
    proibidas = ("API_KEY", "TOKEN", "SECRET", "PASSWORD", "CREDENTIALS")
    encontradas = [nome for nome in variaveis if nome.upper() in proibidas]
    if encontradas:
        raise ValueError(f"gate nao pode exigir credencial: {encontradas}")


# ---------------------------------------------------------------------------
# DORA como sistema, nunca ranking individual (ES26-048).
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class MetricasDora:
    """Quatro metricas lidas juntas: fluxo (frequencia/lead) e seguranca (falha/restaura)."""

    frequencia_deploy_exemplo: float
    lead_time_h_exemplo: float
    taxa_falha_exemplo: float
    tempo_restauracao_h_exemplo: float


def decidir_entrega(metricas: MetricasDora) -> str:
    """Cada metrica amarra uma decisao operacional declarada, nunca avaliacao de pessoa."""
    if (
        metricas.frequencia_deploy_exemplo < 0.0
        or metricas.lead_time_h_exemplo < 0.0
        or not 0.0 <= metricas.taxa_falha_exemplo <= 1.0
        or metricas.tempo_restauracao_h_exemplo < 0.0
    ):
        raise ValueError("metricas DORA fora do dominio declarado")
    if metricas.taxa_falha_exemplo > 0.15:
        return "reforcar-gate"
    if metricas.tempo_restauracao_h_exemplo > 1.0:
        return "conter-rollout"
    if metricas.lead_time_h_exemplo > 24.0:
        return "reordenar-fatias"
    return "manter"


def avaliar_pessoa_por_dora(*, pessoa: str) -> None:
    """Metrica de sistema usada contra pessoa e invalida: sempre nega."""
    raise ValueError(f"DORA nunca ranqueia pessoa: {pessoa!r} fora do dominio")
