"""Oraculo LT02-AT-033: replay preserva identidade e causalidade.

Quarentena guarda a mensagem integral e e consultavel; replay devolve
copia com mesmos IDs/causalidade/chave/hash, attempt zerado e causa
limpa; replay sem correcao volta a quarentena com causa atualizada.
Sem rede.
"""

from __future__ import annotations

from dlq_replay import DlqSegura, MensagemDlq


def _quarentenada() -> MensagemDlq:
    return MensagemDlq(
        message_id="m-33",
        correlation_id="corr-33",
        causation_id="causa-33",
        chave="job-33",
        intent_hash="h-33",
        attempt=3,
        causa="orcamento-esgotado",
    )


def test_quarentena_integral_e_replay_preserva_ids() -> None:
    dlq = DlqSegura()
    assert dlq.quarentenar(_quarentenada()) == "quarentena:orcamento-esgotado"
    assert dlq.quarentenar(_quarentenada()) == "quarentena:orcamento-esgotado"
    assert dlq.tamanho() == 1  # repeticao nao duplica o rastro
    encontrada = dlq.buscar("m-33")
    assert encontrada == _quarentenada()  # integral: IDs, attempt e causa
    assert dlq.buscar("ausente") is None
    assert dlq.replay("ausente") is None
    # Causa corrigida: replay volta ao processamento com mesmos IDs.
    devolvida = dlq.replay("m-33")
    assert devolvida is not None
    assert devolvida.message_id == "m-33"
    assert devolvida.correlation_id == "corr-33"
    assert devolvida.causation_id == "causa-33"
    assert devolvida.chave == "job-33"
    assert devolvida.intent_hash == "h-33"
    assert devolvida.attempt == 0
    assert devolvida.causa == ""
    assert dlq.buscar("m-33") == _quarentenada()  # original intacta


def test_replay_sem_correcao_volta_a_quarentena_com_causa_atualizada() -> None:
    dlq = DlqSegura()
    dlq.quarentenar(_quarentenada())
    devolvida = dlq.replay("m-33")
    assert devolvida is not None
    # Sem correcao comprovada: reprocessamento falha e volta com nova causa.
    causa = dlq.quarentenar(
        MensagemDlq(
            message_id=devolvida.message_id,
            correlation_id=devolvida.correlation_id,
            causation_id=devolvida.causation_id,
            chave=devolvida.chave,
            intent_hash=devolvida.intent_hash,
            attempt=1,
            causa="provedor-ainda-429",
        )
    )
    assert causa == "quarentena:provedor-ainda-429"
    assert dlq.tamanho() == 1  # mesmo message_id nao duplica o rastro
    assert dlq.buscar("m-33") == _quarentenada()  # causa original persiste
