"""Oraculo AT-010: custo quadratico da atencao.

Numeros MEDIDOS neste ambiente (CPU, torch 2.9.1, semente 1337;
5 varreduras consecutivas, REPETICOES=5):
  tokens | tempo(ms) | celulas | razao
     128 | 0.07-0.09 |   16384 | --
     256 | 0.10-0.16 |   65536 | 1.33x-2.32x
     512 | 0.25-0.27 |  262144 | 1.54x-2.48x
    1024 | 0.77-0.88 | 1048576 | 3.12x-3.31x

Correcao honesta (precedente B02-L): o "~4x por dobra" do texto vale onde
a computacao domina (512->1024 mede ~3.2x, estavel em 6/6 varreduras);
em T<=512 o tempo e dominado por overhead (lancamento/alocacao) e as
razoes medem ~1.3-2.5x. A banda larga [1.0x, 8.0x] absorve o cronometro
sub-ms (perf_counter, 5 repeticoes); a assinatura quadratica exata esta
nas celulas T*T (4x por dobra, inteiro deterministico) e no crescimento
ponta a ponta (>4x de 128 a 1024 para 8x tokens; medido ~10x).
"""

from itertools import pairwise

from custo_quadratico import CONTEXTOS, varrer_contextos

RAZAO_MIN: float = 1.0
RAZAO_MAX: float = 8.0


def test_celulas_sao_t_vezes_t() -> None:
    """AT-010: cada linha publica celulas exatas T*T, 4x por dobra."""
    linhas = varrer_contextos()
    assert [tokens for tokens, _, _, _ in linhas] == list(CONTEXTOS)
    for tokens, _, celulas, _ in linhas:
        assert celulas == tokens * tokens
    for anterior, atual in pairwise(linhas):
        assert atual[2] == 4 * anterior[2]


def test_primeiro_item_sem_razao() -> None:
    """AT-010: a primeira linha nao tem dobra anterior ('--')."""
    linhas = varrer_contextos()
    assert linhas[0][3] == "--"


def test_razoes_em_banda_larga() -> None:
    """AT-010: razoes por dobra em [1.0x, 8.0x]; salto final superlinear."""
    linhas = varrer_contextos()
    razoes: list[float] = []
    for _, _, _, razao in linhas[1:]:
        assert razao.endswith("x")
        razoes.append(float(razao[:-1]))
    assert len(razoes) == len(CONTEXTOS) - 1
    for razao_valor in razoes:
        assert RAZAO_MIN <= razao_valor <= RAZAO_MAX
    assert 2.0 <= razoes[-1] <= RAZAO_MAX  # 512->1024, medido ~3.2x
    tempos = [ms for _, ms, _, _ in linhas]
    assert all(ms > 0.0 for ms in tempos)
    assert tempos[-1] / tempos[0] > 4.0  # ponta a ponta, medido ~10x
