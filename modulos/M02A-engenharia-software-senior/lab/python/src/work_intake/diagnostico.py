"""Produto instalavel e diagnostico com metodo (B13-L).

Contratos VERBATIM da secao <section id="b13"> de M02A.html: escolha
idiomatica decidida por responsabilidade, legibilidade e custo medido no
volume real (ES26-049); fronteira que valida em runtime antes do dominio
tipado, com coercao, construcao sem validador e mutacao pos-validacao sob
limites declarados (ES26-050); produto declarado em ``pyproject.toml``,
distribuido em wheel e executado fora do source tree com origem afirmada
e CLI por ponto de entrada (ES26-051; AT-040); depuracao por imports,
memoria, I/O e concorrencia com oraculo por parada, e normalizacao de
newline, casing e paths na entrada nos dois sistemas (ES26-052; AT-041;
AT-020/021 herdados em forma reduzida).

Limite auditavel: sem rede, sem Docker, sem Windows real e sem provedor
real; Windows e coberto por ``PureWindowsPath``/``PurePosixPath`` e pela
mesma suite, nunca por execucao observada. Numeros de seeds, amostras,
timeouts e contagens sao exemplo variavel: a reprodutibilidade vem de
seed, amostra bruta e digest, nunca do numero impresso.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import platform
import sys
from collections.abc import Awaitable, Callable, Iterator, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path, PurePath
from typing import Final

SEED_B13L: Final[int] = 20260922
TIMEOUT_EXEMPLO_S: Final[float] = 0.05
N_AMOSTRAS_EXEMPLO: Final[int] = 8
VERSAO_PRODUTO_EXEMPLO: Final[str] = "0.1.0-exemplo"
COMMIT_EXEMPLO: Final[str] = "commit-exemplo-b13l"

LIMITACOES_B13L: Final[tuple[str, ...]] = (
    "recorte local sem rede, Docker, provedor real ou Windows observado",
    "wheel prova instalacao local; publicar, assinar e versionar releases ficam fora",
    "Windows coberto por PureWindowsPath/PurePosixPath e mesma suite, sem execucao real",
    "timeout/cancelamento locais; B14 distingue sobrecarga de morte de processo",
    "numeros sao exemplo variavel: validos para seed/amostra/digest acima",
)

FRONTEIRA_CAMPOS_EXIGIDOS_EXEMPLO: Final[frozenset[str]] = frozenset({"titulo", "intencao"})
FRONTEIRA_CAMPOS_OPCIONAIS_EXEMPLO: Final[frozenset[str]] = frozenset({"observacao"})

NOMES_RESERVADOS_WINDOWS_EXEMPLO: Final[frozenset[str]] = frozenset(
    {
        "con",
        "prn",
        "aux",
        "nul",
        "com1",
        "com2",
        "com3",
        "com4",
        "com5",
        "com6",
        "com7",
        "com8",
        "com9",
        "lpt1",
        "lpt2",
        "lpt3",
        "lpt4",
        "lpt5",
        "lpt6",
        "lpt7",
        "lpt8",
        "lpt9",
    }
)

SUFIXOS_WHEEL_EXEMPLO: Final[tuple[str, ...]] = (
    "work_intake/cli.py",
    "work_intake/py.typed",
    "work_intake/adapters/sqlite/001_initial.sql",
    ".dist-info/entry_points.txt",
)


# ---------------------------------------------------------------------------
# Escolha idiomatica por responsabilidade, legibilidade e custo (ES26-049).
# Gerador vence a lista quando o consumidor processa item a item e o volume
# nao cabe confortavelmente na memoria; a decisao cita volume e consumidor.
# ---------------------------------------------------------------------------


def iterar_linhas(texto_normalizado: str) -> Iterator[str]:
    """Gerador preguicoso: nao aloca nem percorre nada ate ser iterado."""
    yield from texto_normalizado.split("\n")


def materializar_linhas(texto_normalizado: str) -> list[str]:
    """Lista materializada: permite reitarar e medir tamanho, paga memoria."""
    return texto_normalizado.split("\n")


# ---------------------------------------------------------------------------
# Normalizacao cross-platform antes de comparar (AT-041; ES26-052).
# Logica VERBATIM do trecho conceitual: newline para quebra unica, dobra
# de caixa com semantica Unicode, caminho pela forma normalizada.
# ---------------------------------------------------------------------------


def normalizar_newline(texto: str) -> str:
    """CRLF e CR legado viram LF na entrada, antes de qualquer comparacao."""
    return texto.replace("\r\n", "\n").replace("\r", "\n")


def normalizar_chave(texto: str) -> str:
    """Dobra a caixa com semantica Unicode; texto vazio nega."""
    chave = texto.casefold().strip()
    if not chave:
        raise ValueError("chave vazia nao define comparacao-exemplo")
    return chave


def forma_normalizada_caminho(caminho: PurePath) -> str:
    """Caminho pela forma normalizada: posix dobrado, sem separador literal."""
    return caminho.as_posix().casefold()


def normalizar_entrada(texto: str, caminho: PurePath) -> tuple[str, str]:
    """Normalizacao conceitual do AT-041: newline, casing e paths antes da regra."""
    plano = texto.replace("\r\n", "\n").replace("\r", "\n")
    chave = plano.casefold()
    return (chave, caminho.as_posix().casefold())


def exigir_nome_portavel(nome: str) -> str:
    """Nome sem reserva de Windows e sem separador; reservado nega."""
    if not nome or "/" in nome or "\\" in nome:
        raise ValueError("nome portavel exige texto sem separador-exemplo")
    if nome.casefold() in NOMES_RESERVADOS_WINDOWS_EXEMPLO:
        raise ValueError(f"nome reservado no Windows-exemplo: {nome!r}")
    return nome


def construir_caminho(*partes: str) -> Path:
    """Constroi com pathlib, nunca concatenando texto com separador literal."""
    if not partes or any(not parte for parte in partes):
        raise ValueError("caminho exige ao menos uma parte nao vazia-exemplo")
    caminho = Path(partes[0])
    for parte in partes[1:]:
        caminho = caminho / parte
    return caminho


# ---------------------------------------------------------------------------
# Fronteira que valida em runtime; dominio recebe valor ja admitido (ES26-050).
# Anotacao declara para leitor e verificador; a verdade de runtime se prova
# aqui, onde dado nao confiavel entra.
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ResultadoFronteira:
    """Saida da validacao runtime: campos admitidos ou motivo estavel."""

    ok: bool
    campos: tuple[tuple[str, str], ...]
    motivo: str


@dataclass(frozen=True, slots=True)
class FronteiraCampos:
    """Fronteira fechada: exige, admite opcionais e recusa o desconhecido."""

    campos_exigidos: frozenset[str]
    campos_opcionais: frozenset[str] = frozenset()
    coagir: bool = False

    def validar(self, dado_bruto: object) -> ResultadoFronteira:
        """Valida em runtime; fora do dominio tipado nada se presume."""
        if not isinstance(dado_bruto, Mapping):
            return ResultadoFronteira(
                ok=False, campos=(), motivo="dado-bruto-nao-mapeamento-exemplo"
            )
        chaves: list[str] = []
        for chave in dado_bruto:
            if not isinstance(chave, str):
                return ResultadoFronteira(
                    ok=False, campos=(), motivo="chave-nao-texto-na-fronteira-exemplo"
                )
            chaves.append(chave)
        faltando = sorted(self.campos_exigidos - frozenset(chaves))
        if faltando:
            return ResultadoFronteira(
                ok=False,
                campos=(),
                motivo=f"campo-exigido-ausente-exemplo: {','.join(faltando)}",
            )
        desconhecidas = sorted(set(chaves) - self.campos_exigidos - self.campos_opcionais)
        if desconhecidas:
            return ResultadoFronteira(
                ok=False,
                campos=(),
                motivo=f"campo-desconhecido-na-fronteira-exemplo: {','.join(desconhecidas)}",
            )
        admitidos: list[tuple[str, str]] = []
        for chave in sorted(chaves):
            valor = dado_bruto[chave]
            if isinstance(valor, str):
                admitidos.append((chave, valor))
            elif self.coagir and isinstance(valor, (int, float, bool)):
                admitidos.append((chave, str(valor)))
            else:
                return ResultadoFronteira(
                    ok=False,
                    campos=(),
                    motivo=f"tipo-inesperado-sem-coercao-exemplo: {chave}",
                )
        return ResultadoFronteira(ok=True, campos=tuple(admitidos), motivo="")


def admitir_pedido(fronteira: FronteiraCampos, dado_bruto: object) -> tuple[str, object]:
    """Trecho conceitual do bloco em forma executavel (ES26-050)."""
    pedido = fronteira.validar(dado_bruto)
    if not pedido.ok:
        return ("rejeitado", pedido.motivo)
    return ("admitido", pedido.campos)


@dataclass(frozen=True, slots=True)
class ValorAdmitido:
    """Valor do dominio: so existe admitido; construir direto nao admite."""

    campos: tuple[tuple[str, str], ...] = ()
    via_fronteira: bool = False


def admitir_valor(resultado: ResultadoFronteira) -> ValorAdmitido:
    """Carimba o valor que passou pela fronteira; rejeitado nega."""
    if not resultado.ok:
        raise ValueError(f"fronteira rejeitou o valor-exemplo: {resultado.motivo}")
    return ValorAdmitido(campos=resultado.campos, via_fronteira=True)


def exigir_admitido(valor: ValorAdmitido) -> tuple[tuple[str, str], ...]:
    """Construcao sem validador produz tipo valido e regra invalida: nega."""
    if not valor.via_fronteira:
        raise ValueError("valor-nao-passou-pela-fronteira-exemplo")
    return valor.campos


FRONTEIRA_B13L = FronteiraCampos(
    campos_exigidos=FRONTEIRA_CAMPOS_EXIGIDOS_EXEMPLO,
    campos_opcionais=FRONTEIRA_CAMPOS_OPCIONAIS_EXEMPLO,
)


# ---------------------------------------------------------------------------
# Diagnostico de ambiente e oraculo de instalacao limpa (AT-040; ES26-051).
# O teste que importa executa o artefato instalado a partir de outro
# diretorio, sem enxergar o checkout por acidente.
# ---------------------------------------------------------------------------


def diagnosticar_ambiente() -> dict[str, str]:
    """Registra SO, runtime, origem do modulo importado e diretorio atual."""
    return {
        "so": platform.system(),
        "runtime": platform.python_version(),
        "executavel": sys.executable,
        "origem_modulo": str(Path(__file__).resolve()),
        "cwd": str(Path.cwd()),
    }


def origem_instalada(origem_modulo: str, checkout: str) -> bool:
    """Oraculo conceitual do AT-040: origem instalada, nunca o source tree."""
    origem = origem_modulo.replace("\\", "/")
    base = checkout.replace("\\", "/")
    return bool(origem) and bool(base) and not origem.startswith(base)


def faltantes_no_wheel(nomes: Sequence[str]) -> tuple[str, ...]:
    """Artefatos do wheel presentes: CLI, typing marker, migracao e entry point."""
    return tuple(
        sufixo
        for sufixo in SUFIXOS_WHEEL_EXEMPLO
        if not any(nome.endswith(sufixo) for nome in nomes)
    )


def ponto_entrada_presente(texto_entry_points: str, nome: str = "work-intake") -> bool:
    """Comando instalado responde pelo nome do ponto de entrada."""
    prefixo = f"{nome} ="
    return any(linha.strip().startswith(prefixo) for linha in texto_entry_points.splitlines())


# ---------------------------------------------------------------------------
# Concorrencia em forma reduzida: operacao possuida com prazo, cleanup e
# descarte contabilizado (AT-020/021 herdados; ES26-052).
# ---------------------------------------------------------------------------


@dataclass
class ContagemDescarte:
    """Descarte contabilizado: concluida, timeout com cleanup ou cancelada fora."""

    concluidas: int = 0
    timeouts: int = 0
    cancelamentos_externos: int = 0


async def executar_possuida(
    operacao: Callable[[], Awaitable[None]],
    *,
    seconds: float,
    contagem: ContagemDescarte,
) -> str:
    """Prazo cancela a operacao possuida; cancelamento externo chega ao chamador."""
    if seconds <= 0.0:
        raise ValueError("prazo da operacao possuida deve ser positivo-exemplo")
    try:
        async with asyncio.timeout(seconds):
            await operacao()
    except TimeoutError:
        contagem.timeouts += 1
        return "timeout-com-cleanup-exemplo"
    except asyncio.CancelledError:
        contagem.cancelamentos_externos += 1
        raise
    contagem.concluidas += 1
    return "concluida-exemplo"


# ---------------------------------------------------------------------------
# Corpus normalizado com seed e digest (evidencia recalculavel).
# ---------------------------------------------------------------------------

CORPUS_B13L: Final[tuple[tuple[str, str], ...]] = (
    ("Titulo Exemplo\r\nSegunda Linha", "Relatorios/Evidencia.JSON"),
    ("TITULO EXEMPLO\nSEGUNDA LINHA", "relatorios\\evidencia.json"),
    ("Titulo Exemplo\rSegunda Linha", "RELATORIOS/EVIDENCIA.json"),
    ("Straße Exemplo", "relatorios/strasse-exemplo.json"),
    ("STRASSE EXEMPLO", "RELATORIOS/STRASSE-EXEMPLO.JSON"),
    ("pedido-exemplo-01", "fixtures/golden/request-v1.json"),
    ("PEDIDO-EXEMPLO-01", "FIXTURES/GOLDEN/REQUEST-V1.JSON"),
    ("intencao com  acento: revisão", "intencao/revisao.json"),
)


def digest_normalizacao(seed: int, itens: Sequence[tuple[str, str]]) -> str:
    """Digest canonico do bruto normalizado (seed + entradas + saidas)."""
    saidas = [
        (texto, caminho, normalizar_chave(normalizar_newline(texto)), caminho.casefold())
        for texto, caminho in itens
    ]
    canonico = json.dumps(
        {"seed": seed, "itens": saidas},
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(canonico.encode("utf-8")).hexdigest()


NORMALIZADOS_B13L: Final[tuple[tuple[str, str], ...]] = tuple(
    (normalizar_chave(normalizar_newline(texto)), caminho.casefold())
    for texto, caminho in CORPUS_B13L
)
DIGEST_B13L: Final[str] = digest_normalizacao(SEED_B13L, CORPUS_B13L)
