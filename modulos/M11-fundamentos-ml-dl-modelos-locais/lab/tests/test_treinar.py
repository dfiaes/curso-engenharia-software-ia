"""Oraculo AT-014: treino desce, validacao sobe; holdout decide a parada.

Numeros MEDIDOS neste ambiente (CPU, torch 2.9.1, corpus CHAR 9957/vocab 75):
normal (600 passos): treino 4.421 -> 1.141, valid 4.269 -> 1.674
  (valid caiu ate ~1.59 e voltou a subir no fim: inicio de overfitting
  visivel ate no treino normal);
demo (prefixo 2000 chars, 2400 passos): treino 4.374 -> 0.091,
  valid 4.161 -> 1.457, com valid oscilando 1.12-1.60 apos 800 passos
  enquanto o treino segue descendo - overfitting declarado pelo GAP
  treino/val (13x), nao por valor absoluto (a valid da demo e MENOR que
  a do normal: corpus menor e mais facil).
Limiares com margem folgada em torno do medido.
"""

import math

import torch

from treinar import (
    CONTEXTO,
    LOTE,
    PASSOS,
    TAXA,
    carregar_texto,
    codificar,
    construir_vocab,
    dividir,
    fazer_lote,
    treinar,
)


def test_split_90_10_e_deslocamento_unitario() -> None:
    """Split 90/10 cobre tudo sem vazar; y e x deslocado de 1."""
    texto = carregar_texto()
    stoi, itos = construir_vocab(texto)
    dados = codificar(texto, stoi)
    assert "".join(itos[int(i)] for i in dados) == texto
    treino, valid = dividir(dados)
    assert len(treino) + len(valid) == len(dados)
    assert len(treino) == int(0.9 * len(dados))
    x, y = fazer_lote(treino, CONTEXTO, LOTE)
    assert x.shape == torch.Size([LOTE, CONTEXTO])
    assert y.shape == torch.Size([LOTE, CONTEXTO])
    assert torch.equal(y[:, :-1], x[:, 1:])


def test_treino_curto_desce_com_valid_finita() -> None:
    """AT-014 positivo: 600 passos derrubam o treino 4.42 -> 1.14 (medido)."""
    assert PASSOS == 600
    assert TAXA == 3e-4
    final_treino, final_valid = treinar()
    assert final_treino < 2.5  # medido 1.141
    assert math.isfinite(final_valid)
    assert final_valid < 3.0  # medido 1.674


def test_demo_overfitting_declara_pelo_gap() -> None:
    """AT-014 negativo: demo com treino 0.09 contra valid 1.46 (medido)."""
    final_treino, final_valid = treinar(demo_overfitting=True)
    assert final_treino < 0.5  # medido 0.091: decorou
    assert final_valid > 0.5  # medido 1.457: nao generalizou
    assert final_valid > final_treino  # gap declara overfitting
