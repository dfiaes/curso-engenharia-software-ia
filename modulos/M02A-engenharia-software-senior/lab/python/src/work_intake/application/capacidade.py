"""Complexidade, performance e custo locais: workload, amostras e saturacao (B11-L).

Contratos VERBATIM da secao <section id="b11"> de M02A.html: comparacao de
representacao no caminho real (lista O(n) contra conjunto O(1) medio),
warm-up descartado, amostras brutas persistidas com seed, configuracao e
digest, e varredura de carga crescente que localiza o joelho de saturacao e
o comportamento de backpressure. Estatistica p50/p95/erro/throughput deriva
do bruto persistido (AT-037); saturacao e localizada sem threshold universal
e sem ranking entre maquinas (AT-038). Cache troca recomputacao por memoria
com invalidacao por versao de policy e teto; custo unitario so vale ligado
a outcome com vereditos preservados.

Limite auditavel: workload local, sem rede, sem concorrencia externa e sem
concorrencia real; corpus fixo e hardware unico. Numeros de amostras, cargas
e patamares sao exemplo variavel: a reprodutibilidade vem de seed, amostra
bruta e digest, nunca do numero impresso.
"""

from __future__ import annotations

import hashlib
import json
import math
import random
import statistics
import time
from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Final

SEED_B11L: Final[int] = 20260920
WARMUP_EXEMPLO: Final[int] = 10
N_AMOSTRAS_EXEMPLO: Final[int] = 120
TAXA_ERRO_EXEMPLO: Final[float] = 0.05
CARGAS_EXEMPLO: Final[tuple[int, ...]] = (10, 20, 30, 40, 50, 60)
CAPACIDADE_EXEMPLO: Final[int] = 40
TETO_CACHE_EXEMPLO: Final[int] = 50
VERSAO_POLICY_EXEMPLO: Final[str] = "v1-exemplo"
JANELA_EXEMPLO_S: Final[float] = 1.0

LIMITACOES_B11L: Final[tuple[str, ...]] = (
    "workload local sem rede e sem concorrencia externa; nao mede producao",
    "corpus fixo em vez de trafego real; hardware unico; janela curta",
    "sem threshold universal de latencia e sem ranking entre maquinas",
    "numeros sao exemplo variavel: validos para seed/amostra/digest acima",
)


# ---------------------------------------------------------------------------
# Contratos VERBATIM da secao b11: representacao pelo padrao de acesso.
# Divergencia minima do trecho conceitual: o conjunto e pre-construido fora
# do caminho quente (frozenset) em vez de set(codigos) por consulta, que
# pagaria O(n) de construcao a cada acesso e anularia o O(1) medio.
# ---------------------------------------------------------------------------


def pertinencia_lista(codigos: Sequence[str], alvo: str) -> bool:
    """O(n) por consulta: varre ate encontrar; barato para poucos itens."""
    return alvo in codigos


def pertinencia_conjunto(codigos: frozenset[str], alvo: str) -> bool:
    """O(1) medio por consulta: hash direto; paga memoria e construcao."""
    return alvo in codigos


def construir_corpus(
    seed: int, n_pedidos: int, n_codigos: int
) -> tuple[tuple[str, ...], tuple[str, ...]]:
    """Corpus deterministico: base de reason codes e mistura declarada de alvos."""
    if n_pedidos < 1 or n_codigos < 1:
        raise ValueError("corpus exige ao menos um pedido e um codigo")
    rng = random.Random(seed)
    base = tuple(f"rc-{i:04d}" for i in range(n_codigos))
    ausentes = tuple(f"zz-{i:04d}" for i in range(n_codigos))
    alvos = tuple(
        rng.choice(base) if i % 2 == 0 else rng.choice(ausentes) for i in range(n_pedidos)
    )
    return (base, alvos)


# ---------------------------------------------------------------------------
# Amostras brutas persistidas com seed, configuracao e digest (AT-037).
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Amostra:
    """Uma duracao bruta com seu resultado; warm-up ja removido."""

    duracao_s: float
    ok: bool
    veredito: str


@dataclass(frozen=True, slots=True)
class ConfigExperimento:
    """Configuracao declarada do experimento; compoe o digest."""

    seed: int
    warmup: int
    n_amostras: int
    cargas: tuple[int, ...]
    capacidade: int
    versao_policy: str
    teto_cache: int


CONFIG_B11L = ConfigExperimento(
    seed=SEED_B11L,
    warmup=WARMUP_EXEMPLO,
    n_amostras=N_AMOSTRAS_EXEMPLO,
    cargas=CARGAS_EXEMPLO,
    capacidade=CAPACIDADE_EXEMPLO,
    versao_policy=VERSAO_POLICY_EXEMPLO,
    teto_cache=TETO_CACHE_EXEMPLO,
)


def gerar_duracoes(seed: int, n: int) -> tuple[float, ...]:
    """Duracoes sinteticas deterministicas; a seed reproduz o bruto exato."""
    if n < 1:
        raise ValueError("amostra exige ao menos uma duracao")
    rng = random.Random(seed)
    return tuple(0.0002 + rng.expovariate(1.0 / 0.0001) for _ in range(n))


def gerar_amostras(seed: int, n: int, taxa_erro: float) -> tuple[Amostra, ...]:
    """Amostra bruta deterministica: duracoes mais resultado por avaliacao."""
    if not 0.0 <= taxa_erro < 1.0:
        raise ValueError("taxa de erro deve estar em [0, 1)")
    rng = random.Random(seed + 1)
    return tuple(
        Amostra(
            duracao_s=duracao,
            ok=False,
            veredito="erro-exemplo",
        )
        if rng.random() < taxa_erro
        else Amostra(duracao_s=duracao, ok=True, veredito="decisao-exemplo")
        for duracao in gerar_duracoes(seed, n)
    )


def digest_experimento(seed: int, config: ConfigExperimento, amostras: Sequence[Amostra]) -> str:
    """Digest canonico do bruto (seed + config + amostras = evidencia)."""
    canonico = json.dumps(
        {
            "seed": seed,
            "config": {
                "warmup": config.warmup,
                "n_amostras": config.n_amostras,
                "cargas": list(config.cargas),
                "capacidade": config.capacidade,
                "versao_policy": config.versao_policy,
                "teto_cache": config.teto_cache,
            },
            "amostras": [[a.duracao_s, a.ok, a.veredito] for a in amostras],
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonico.encode("utf-8")).hexdigest()


def verificar_digest(
    seed: int, config: ConfigExperimento, amostras: Sequence[Amostra], digest: str
) -> bool:
    """Confere se o bruto apresentado corresponde ao digest declarado."""
    return digest_experimento(seed, config, amostras) == digest


@dataclass(frozen=True, slots=True)
class Resumo:
    """Estatistica derivada do bruto persistido; nunca de anotacao manual."""

    p50: float
    p95: float
    erro: float
    throughput: float
    n: int


def _p95(duracoes_ordenadas: list[float]) -> float:
    n = len(duracoes_ordenadas)
    if n >= 101:
        return statistics.quantiles(duracoes_ordenadas, n=100, method="exclusive")[94]
    posicao = math.ceil(0.95 * n) - 1
    return duracoes_ordenadas[posicao]


def resumir(amostras: Sequence[Amostra]) -> Resumo:
    """Deriva p50/p95/erro/throughput do bruto; vazio nega com ValueError.

    Divergencia minima do trecho conceitual: o trecho usa
    ``quantiles(n=100)[24::25]`` e rotula o resultado como p25/p75/p95, mas
    esse fatiamento entrega p25/p50/p75 (indices 24/49/74 de 99 cortes) e
    exige n >= 101 sem declarar. Aqui p50 usa mediana e p95 usa o corte 94
    do quantil exclusivo, com estatistica de ordem para n < 101.
    """
    if len(amostras) == 0:
        raise ValueError("amostras vazias nao definem estatistica")
    duracoes = [a.duracao_s for a in amostras]
    if any(d <= 0.0 for d in duracoes):
        raise ValueError("duracao bruta deve ser positiva")
    total = sum(duracoes)
    if total <= 0.0:
        raise ValueError("soma das duracoes deve ser positiva")
    ordenadas = sorted(duracoes)
    erros = sum(1 for a in amostras if not a.ok)
    return Resumo(
        p50=statistics.median(duracoes),
        p95=_p95(ordenadas),
        erro=erros / len(amostras),
        throughput=len(amostras) / total,
        n=len(amostras),
    )


def executar_workload(
    representacao: str, codigos_base: Sequence[str], alvos: Sequence[str], warmup: int
) -> tuple[Amostra, ...]:
    """Workload local no caminho real com warm-up descartado e sem rede.

    Mede cada avaliacao com relogio monotonico; as ``warmup`` primeiras
    execucoes saem da estatistica e a quantidade fica registrada na config.
    """
    if representacao not in ("lista", "conjunto"):
        raise ValueError("representacao deve ser 'lista' ou 'conjunto'")
    if warmup < 0:
        raise ValueError("warmup nao pode ser negativo")
    if len(alvos) == 0:
        raise ValueError("workload exige ao menos um alvo")
    conjunto: frozenset[str] = frozenset(codigos_base)
    for alvo in alvos[:warmup]:
        if representacao == "lista":
            pertinencia_lista(codigos_base, alvo)
        else:
            pertinencia_conjunto(conjunto, alvo)
    amostras: list[Amostra] = []
    for alvo in alvos[warmup:]:
        inicio = time.perf_counter()
        if representacao == "lista":
            encontrado = pertinencia_lista(codigos_base, alvo)
        else:
            encontrado = pertinencia_conjunto(conjunto, alvo)
        fim = time.perf_counter()
        amostras.append(
            Amostra(
                duracao_s=max(fim - inicio, 1e-9),
                ok=True,
                veredito="decisao-exemplo" if encontrado else "decisao-ausente-exemplo",
            )
        )
    return tuple(amostras)


AMOSTRAS_B11L: tuple[Amostra, ...] = gerar_amostras(
    SEED_B11L, N_AMOSTRAS_EXEMPLO, TAXA_ERRO_EXEMPLO
)
RESUMO_B11L: Resumo = resumir(AMOSTRAS_B11L)
DIGEST_B11L: str = digest_experimento(SEED_B11L, CONFIG_B11L, AMOSTRAS_B11L)


# ---------------------------------------------------------------------------
# Capacidade como joelho observado na varredura (AT-038; ES26-044).
# Sem threshold universal e sem ranking entre maquinas por desenho: a
# localizacao nao recebe patamar de latencia e a comparacao exige o mesmo
# seed e a mesma configuracao.
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class PontoCarga:
    """Um degrau da varredura: carga oferecida, vazao, fila e rejeicao."""

    carga: int
    vazao: float
    fila: int
    rejeitadas: int
    backpressure: str


def varrer_carga(
    cargas: Sequence[int], capacidade: int, janela_s: float = JANELA_EXEMPLO_S
) -> tuple[PontoCarga, ...]:
    """Varredura crescente local: admite ate a capacidade e recusa o resto."""
    if capacidade < 1:
        raise ValueError("capacidade deve ser positiva")
    if janela_s <= 0.0:
        raise ValueError("janela deve ser positiva")
    if len(cargas) == 0:
        raise ValueError("varredura exige ao menos uma carga")
    pontos: list[PontoCarga] = []
    for carga in cargas:
        if carga < 0:
            raise ValueError("carga oferecida nao pode ser negativa")
        admitidas = min(carga, capacidade)
        espera = max(0, carga - capacidade)
        pontos.append(
            PontoCarga(
                carga=carga,
                vazao=admitidas / janela_s,
                fila=espera,
                rejeitadas=espera,
                backpressure="recusar-explicito" if espera else "admitir",
            )
        )
    return tuple(pontos)


def localizar_joelho(pontos: Sequence[PontoCarga]) -> int | None:
    """Localiza o joelho: primeiro degrau em que a vazao para de crescer e a fila acumula.

    Nao recebe threshold de latencia nem patamar absoluto: capacidade e o
    ponto de dobra observado nesta varredura, nao um numero universal.
    """
    for i in range(1, len(pontos)):
        if pontos[i].vazao <= pontos[i - 1].vazao and pontos[i].fila > pontos[i - 1].fila:
            return i
    return None


def exigir_mesmo_contexto(
    seed_a: int, config_a: ConfigExperimento, seed_b: int, config_b: ConfigExperimento
) -> None:
    """Comparar varreduras de contextos distintos e ranking invalido: nega."""
    if seed_a != seed_b or config_a != config_b:
        raise ValueError("contextos distintos nao admitem ranking entre maquinas")


VARREDURA_B11L: tuple[PontoCarga, ...] = varrer_carga(CARGAS_EXEMPLO, CAPACIDADE_EXEMPLO)
JOELHO_B11L: int | None = localizar_joelho(VARREDURA_B11L)


# ---------------------------------------------------------------------------
# Cache com invalidacao por versao e teto; custo unitario ligado a outcome.
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class EntradaCache:
    valor: str
    policy: str


class CacheVersionado:
    """Troca recomputacao por memoria com invalidacao e teto declarados."""

    def __init__(self, *, teto: int, versao_policy: str) -> None:
        if teto < 1:
            raise ValueError("teto do cache deve ser positivo")
        if not versao_policy:
            raise ValueError("cache exige versao de policy declarada")
        self._teto = teto
        self._versao_policy = versao_policy
        self._itens: dict[str, EntradaCache] = {}
        self._ordem: list[str] = []
        self.acertos: int = 0

    @property
    def teto(self) -> int:
        return self._teto

    @property
    def versao_policy(self) -> str:
        return self._versao_policy

    def __len__(self) -> int:
        return len(self._itens)

    def guardar(self, chave: str, valor: str) -> None:
        if chave not in self._itens and len(self._itens) >= self._teto:
            mais_antiga = self._ordem.pop(0)
            del self._itens[mais_antiga]
        if chave not in self._itens:
            self._ordem.append(chave)
        self._itens[chave] = EntradaCache(valor=valor, policy=self._versao_policy)

    def buscar(self, chave: str) -> tuple[str | None, bool]:
        entrada = self._itens.get(chave)
        if entrada is not None and entrada.policy == self._versao_policy:
            self.acertos += 1
            return (entrada.valor, True)
        return (None, False)

    def trocar_policy(self, nova_versao: str) -> None:
        if not nova_versao:
            raise ValueError("nova versao de policy nao pode ser vazia")
        self._versao_policy = nova_versao


def buscar_com_cache(
    chave: str, versao_policy: str, cache: dict[str, dict[str, str]]
) -> tuple[str | None, bool]:
    """Acerto so vale na policy vigente; forma executavel do trecho do bloco."""
    entrada = cache.get(chave)
    if entrada is not None and entrada.get("policy") == versao_policy:
        return (entrada.get("valor"), True)
    return (None, False)


def custo_unitario_por_avaliacao(
    tempo_total_s: float, n_avaliacoes: int, vereditos_iguais: bool
) -> float:
    """Custo por avaliacao; sem outcome preservado nao ha decisao de custo."""
    if not vereditos_iguais:
        raise ValueError("custo sem outcome preservado e vaidade, nao eficiencia")
    if n_avaliacoes < 1:
        raise ValueError("custo exige ao menos uma avaliacao")
    if tempo_total_s < 0.0:
        raise ValueError("tempo total nao pode ser negativo")
    return tempo_total_s / n_avaliacoes


@dataclass(frozen=True, slots=True)
class DecisaoCapacidade:
    """Operar abaixo do joelho com margem ou aceitar fila com consequencia."""

    joelho: int
    margem: int
    carga_operacional: int
    consequencia: str


def decidir_carga(pontos: Sequence[PontoCarga], joelho: int, margem: int) -> DecisaoCapacidade:
    """Amarra a carga operacional ao joelho observado com margem declarada."""
    if joelho < 1 or joelho >= len(pontos):
        raise ValueError("joelho deve ser um ponto interior da varredura")
    if margem < 0:
        raise ValueError("margem nao pode ser negativa")
    carga_joelho = pontos[joelho].carga
    operacional = max(0, carga_joelho - margem)
    return DecisaoCapacidade(
        joelho=joelho,
        margem=margem,
        carga_operacional=operacional,
        consequencia=f"operar-em-{operacional}-abaixo-do-joelho-{carga_joelho}-com-backpressure-recusar-explicito",
    )


@dataclass
class RegistroEvidencia:
    """Amostra bruta persistida com seed, config e digest para rechecagem."""

    itens: list[dict[str, object]] = field(default_factory=list)

    def registrar(self, amostra: Amostra) -> None:
        self.itens.append(
            {"duracao_s": amostra.duracao_s, "ok": amostra.ok, "veredito": amostra.veredito}
        )
