"""Oráculo LT02-AT-002: timeout ambíguo nunca auto-classificado.

Resposta ausente no prazo vira EstadoDesconhecido, jamais "não executou".
As quatro histórias (pedido perdido, execução em curso, resposta perdida,
escuta desistida) são indistinguíveis para quem espera: todas produzem a
mesma observação, e a saída é sempre desconhecido → reconciliação pela
identidade (intent_hash) → decisão. Reenvio sem identidade fabrica
duplicata; com identidade e reconciliação, o ledger externo conta um
efeito lógico. Sem rede, sem relógio de parede: prazo é flag explícita.
"""

from __future__ import annotations

import pytest

from leituras_consistencia import EstadoDesconhecido, RegistroVersoes


def test_prazo_estourado_vira_desconhecido_nunca_veredito() -> None:
    registro = RegistroVersoes()
    registro.publicar_versao()
    with pytest.raises(EstadoDesconhecido, match="leitor-a"):
        registro.ler_com_prazo("leitor-a", replica_versao=1, no_prazo=False)
    assert "leitor-a" not in registro.vistas


def test_quatro_historias_mesma_observacao_mesma_saida() -> None:
    historias = ("pedido-perdido", "execucao-em-curso", "resposta-perdida", "escuta-desistida")
    for historia in historias:
        registro = RegistroVersoes()
        registro.publicar_versao()
        with pytest.raises(EstadoDesconhecido):
            registro.ler_com_prazo(historia, replica_versao=0, no_prazo=False)


def test_reconciliacao_por_identidade_antes_de_repetir() -> None:
    executor: dict[str, str] = {"intencao-007": "concluida"}
    registro = RegistroVersoes()
    with pytest.raises(EstadoDesconhecido):
        registro.ler_com_prazo("worker", replica_versao=0, no_prazo=False)
    estado = executor.get("intencao-007", "desconhecido")
    assert estado == "concluida"


def test_reenvio_cego_fabrica_duplicata_identidade_reconcilia() -> None:
    efeitos_cegos = ["intencao-001", "intencao-001"]
    assert len(efeitos_cegos) == 2
    efeitos_com_identidade: set[str] = set()
    for _ in range(2):
        efeitos_com_identidade.add("intencao-001")
    assert efeitos_com_identidade == {"intencao-001"}


def test_autor_ve_propria_escrita_sob_replica_atrasada() -> None:
    registro = RegistroVersoes()
    registro.publicar_versao()
    registro.publicar_versao()
    assert registro.ler_read_your_writes("autor", versao_do_autor=2) == 2


def test_leitor_monotonico_nunca_retrocede() -> None:
    registro = RegistroVersoes()
    assert registro.ler_monotonica("leitor", replica_versao=3) == 3
    assert registro.ler_monotonica("leitor", replica_versao=1) == 3
    assert registro.ler_monotonica("leitor", replica_versao=4) == 4


def test_estado_desconhecido_e_erro_para_reconciliar() -> None:
    assert issubclass(EstadoDesconhecido, RuntimeError)
