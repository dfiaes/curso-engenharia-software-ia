"""Oraculo LT02-AT-040: anomalia reproduzida, explicada e mitigada.

Semente SEED_B05=20260818, amostra 1 conta com dupla de transferencias
(+50/+50 sobre base 100). Em sequencia soma certo (200); entrelacada no
nivel fraco perde uma soma (150); nivel forte aborta com ConflitoVersao e
a repeticao com releitura converge a 200. SQLite e padrao local rotulado;
PG real e trilha BLOCKED. Sem rede, sem relogio de parede.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from isolamento_niveis import ConflitoVersao, IsolamentoNiveis

SEED_B05 = 20260818
CHAVE = "orcamento-X"
BASE = 100
DELTA = 50


def _banco(tmp_path: Path, nome: str) -> IsolamentoNiveis:
    banco = IsolamentoNiveis(str(tmp_path / nome))
    banco.abrir()
    banco.semear(CHAVE, BASE)
    return banco


def test_sequencia_soma_certo(tmp_path: Path) -> None:
    banco = _banco(tmp_path, "seq.db")
    primeira = banco.ler(CHAVE)
    banco.gravar_fraco(primeira, primeira.saldo + DELTA)
    segunda = banco.ler(CHAVE)
    final = banco.gravar_fraco(segunda, segunda.saldo + DELTA)
    assert final.saldo == BASE + 2 * DELTA
    assert final.versao == 2


def test_entrelacado_fraco_perde_uma_soma(tmp_path: Path) -> None:
    banco = _banco(tmp_path, "fraco.db")
    lida_a = banco.ler(CHAVE)
    lida_b = banco.ler(CHAVE)  # mesma versao: gravacao cega
    assert lida_a.versao == lida_b.versao == 0
    banco.gravar_fraco(lida_a, lida_a.saldo + DELTA)
    banco.gravar_fraco(lida_b, lida_b.saldo + DELTA)
    final = banco.ler(CHAVE)
    assert final.saldo == BASE + DELTA  # uma soma perdida
    assert final.saldo != BASE + 2 * DELTA


def test_forte_aborta_e_releitura_mitiga(tmp_path: Path) -> None:
    banco = _banco(tmp_path, "forte.db")
    lida_a = banco.ler(CHAVE)
    lida_b = banco.ler(CHAVE)
    banco.gravar_forte(lida_a, lida_a.saldo + DELTA)
    with pytest.raises(ConflitoVersao, match="versao superada"):
        banco.gravar_forte(lida_b, lida_b.saldo + DELTA)
    # Mitigacao: repetir com releitura converge sem perda.
    atual = banco.ler(CHAVE)
    final = banco.gravar_forte(atual, atual.saldo + DELTA)
    assert final.saldo == BASE + 2 * DELTA
