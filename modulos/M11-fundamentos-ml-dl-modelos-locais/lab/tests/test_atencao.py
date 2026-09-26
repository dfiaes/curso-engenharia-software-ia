"""Oraculos AT-009 (manual == SDPA) e AT-008 (mascara causal por invariancia).

Numeros MEDIDOS neste ambiente (CPU, torch 2.9.1, semente 1337):
comparar_com_sdpa() devolve erro maximo 0.0 (bit-identico; deterministico
em 3/3 repeticoes) - melhor que a casa de 1e-7 rotulada no Bloco 3 como
exemplo variavel, nunca como promessa. O limiar fixa margem folgada
(erro < 1e-6) em torno do medido.

AT-008 por invariancia causal (oraculo executavel honesto, sem treino):
com mascara tril, perturbar as posicoes > t nao muda a saida em t
(diff medido 0.0); com a variante triu (mesmos pesos, mascara invertida
construida no teste), a mesma perturbacao muda a saida em t (diff
medido 1.44). Em treino, esse vazamento do futuro prende a perda em
ln(vocab) - ver a Tabela de Diagnostico do M11 e a teoria do Bloco 3
(B03-D detalha); aqui se prova o mecanismo, nao o treino.

Divergencia da folha: o negativo planejado (atol=1e-12 deve falhar) e
vacuo aqui - com saidas bit-identicas, allclose(atol=1e-12) PASSA
(medido True). O negativo honesto troca a mascara em vez da tolerancia:
SDPA nao-causal difere do manual causal em 1.95 (allclose False com
atol=1e-5), provando que a equivalencia depende da mascara.
"""

import torch
from torch.nn.functional import scaled_dot_product_attention as sdpa

from atencao import (
    ATOL,
    CONTEXTO_MAX,
    DIM_CABECA,
    DIM_ENTRADA,
    LOTE,
    SEMENTE,
    TOKENS,
    CabecaAtencao,
    comparar_com_sdpa,
)

T_ALVO: int = 3
PERTURBACAO: float = 5.0


def _cabeca_e_entradas_com_futuro_perturbado() -> tuple[CabecaAtencao, torch.Tensor, torch.Tensor]:
    """Cabeca deterministica + entrada; copia com +5.0 nas posicoes > t."""
    torch.manual_seed(SEMENTE)
    cabeca = CabecaAtencao(DIM_ENTRADA, DIM_CABECA, CONTEXTO_MAX)
    torch.manual_seed(7)
    x = torch.randn(LOTE, TOKENS, DIM_ENTRADA)
    torch.manual_seed(7)
    x2 = torch.randn(LOTE, TOKENS, DIM_ENTRADA)
    x2[:, T_ALVO + 1 :, :] += PERTURBACAO
    return cabeca, x, x2


def _cabeca_triu_com_mesmos_pesos(cabeca: CabecaAtencao) -> CabecaAtencao:
    """Variante com mascara invertida (triu) e os mesmos pesos da original."""
    copia = CabecaAtencao(DIM_ENTRADA, DIM_CABECA, CONTEXTO_MAX)
    copia.load_state_dict(cabeca.state_dict())
    copia.mascara.copy_(torch.triu(torch.ones(CONTEXTO_MAX, CONTEXTO_MAX)))
    return copia


def test_manual_equivale_a_sdpa() -> None:
    """AT-009 positivo: mesma semente/entrada, allclose com atol=1e-5."""
    erro = comparar_com_sdpa()
    assert erro <= ATOL
    assert erro < 1e-6  # medido 0.0 neste ambiente (casa de 1e-7 ou melhor)


def test_negativo_mascara_trocada_discrimina() -> None:
    """AT-009 negativo: SDPA nao-causal difere do manual causal."""
    torch.manual_seed(SEMENTE)
    x = torch.randn(LOTE, TOKENS, DIM_ENTRADA)
    cabeca = CabecaAtencao(DIM_ENTRADA, DIM_CABECA, CONTEXTO_MAX)
    manual = cabeca(x)
    q = cabeca.para_query(x)
    k = cabeca.para_key(x)
    v = cabeca.para_value(x)
    nao_causal = sdpa(q, k, v, is_causal=False)
    assert not torch.allclose(manual, nao_causal, atol=ATOL)
    assert (manual - nao_causal).abs().max().item() > 0.5  # medido 1.95


def test_tril_futuro_nao_muda_passado() -> None:
    """AT-008 positivo: perturbar posicoes > t nao muda a saida em t."""
    cabeca, x, x2 = _cabeca_e_entradas_com_futuro_perturbado()
    with torch.no_grad():
        y1 = cabeca(x)
        y2 = cabeca(x2)
    assert torch.allclose(y1[:, T_ALVO, :], y2[:, T_ALVO, :], atol=1e-6)
    assert (y1[:, T_ALVO, :] - y2[:, T_ALVO, :]).abs().max().item() < 1e-6  # medido 0.0
    # A perturbacao nao foi ignorada: a ultima posicao (que enxerga tudo) muda.
    assert not torch.allclose(y1[:, -1, :], y2[:, -1, :], atol=1e-6)
    assert (y1[:, -1, :] - y2[:, -1, :]).abs().max().item() > 0.5  # medido 0.89


def test_triu_futuro_vaza_no_passado() -> None:
    """AT-008 invertido: com triu, perturbar o futuro muda a saida em t."""
    cabeca, x, x2 = _cabeca_e_entradas_com_futuro_perturbado()
    vazada = _cabeca_triu_com_mesmos_pesos(cabeca)
    with torch.no_grad():
        z1 = vazada(x)
        z2 = vazada(x2)
    assert not torch.allclose(z1[:, T_ALVO, :], z2[:, T_ALVO, :], atol=1e-6)
    assert (z1[:, T_ALVO, :] - z2[:, T_ALVO, :]).abs().max().item() > 0.5  # medido 1.44
