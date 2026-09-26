"""Oraculo AT-012: BPE toy separa 1234 de 1235 sem tiktoken nem rede.

Numeros MEDIDOS neste ambiente (puro Python, sem torch):
provar_numeros_vizinhos() publica (['1234'], ['123', '5']) -
deterministico em repeticao.
"""

from bpe_mini import CORPUS_TOY, N_FUSOES, provar_numeros_vizinhos, segmentar, treinar_bpe


def test_vizinhos_caem_em_segmentos_distintos() -> None:
    """AT-012 positivo: 1234 vira 1 segmento; 1235 vira 2 distintos."""
    seg_1234, seg_1235 = provar_numeros_vizinhos()
    assert seg_1234 == ["1234"]
    assert seg_1235 == ["123", "5"]
    assert seg_1234 != seg_1235


def test_fusoes_sao_deterministicas() -> None:
    """AT-012: mesmo corpus e N produzem a mesma tabela de fusoes."""
    assert treinar_bpe() == treinar_bpe()
    assert treinar_bpe() == treinar_bpe(CORPUS_TOY, N_FUSOES)


def test_sem_tabela_nao_ha_compressao() -> None:
    """AT-012 negativo: sem fusoes, 1234 segue em 4 caracteres."""
    assert segmentar("1234", []) == ["1", "2", "3", "4"]
    assert len(provar_numeros_vizinhos()[0]) < len(segmentar("1234", []))
