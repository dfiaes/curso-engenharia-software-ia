"""Oráculos B07-L: entrega idempotente, rede simulada, saga e reentrega após 'queda'."""

from __future__ import annotations

from typing import Any

import pytest
from work_intake.application.entrega import (
    CaixaDeSaida,
    ConflictError,
    PassoSaga,
    Saga,
    entregar,
)
from work_intake.domain.simulacao import (
    FilaLimitadaSimulada,
    OperacaoSimulada,
    RedeSimulada,
)

SEED = 20260912


class ConsumidorDedup:
    """Receptor at-least-once que transforma repetição em efeito único."""

    def __init__(self) -> None:
        self.vistos: set[tuple[str, str]] = set()
        self.aplicados = 0

    def receber(self, chave: str, intencao: str) -> None:
        """Aplica uma vez por par chave+intenção; repetição é ignorada."""
        if (chave, intencao) in self.vistos:
            return
        self.vistos.add((chave, intencao))
        self.aplicados += 1


def test_repeticao_reutiliza_e_colisao_conflita() -> None:
    """AT-013 no recorte B07: mesma chave+intenção reutiliza; intenção divergente conflita."""
    caixa = CaixaDeSaida()
    primeiro = entregar(caixa, chave="k-013", intencao="matricular", evento="e1")
    assert entregar(caixa, chave="k-013", intencao="matricular", evento="e1") == primeiro
    assert len(caixa.publicados) == 1
    with pytest.raises(ConflictError):
        entregar(caixa, chave="k-013", intencao="outra-intencao", evento="e2")
    assert len(caixa.publicados) == 1
    assert caixa.pendentes == 0


def test_duplicata_de_rede_tem_efeito_unico() -> None:
    """Retry duplica na rede; o receptor deduplica por chave+intenção."""
    rede = RedeSimulada(seed=SEED, duplicar=("k-dup",))
    caixa = CaixaDeSaida(agora=rede.relogio)
    registro = entregar(caixa, chave="k-dup", intencao="matricular", evento="e-dup")
    rede.transmitir(registro.chave, registro.intencao, registro.evento)
    entregas = rede.colher()
    assert len(entregas) == 2
    consumidor = ConsumidorDedup()
    for evento in entregas:
        consumidor.receber(evento.chave, evento.intencao)
    assert consumidor.aplicados == 1


def test_perda_transiente_exige_retry_ate_confirmar() -> None:
    """Mensagem perdida não chega; retry após o transiente entrega exatamente uma vez."""
    rede = RedeSimulada(seed=SEED, perda=("k-perda",))
    caixa = CaixaDeSaida(agora=rede.relogio)
    registro = entregar(caixa, chave="k-perda", intencao="matricular", evento="e-perda")
    rede.transmitir(registro.chave, registro.intencao, registro.evento)
    assert rede.colher() == []
    rede.perda = ()
    rede.transmitir(registro.chave, registro.intencao, registro.evento)
    entregas = rede.colher()
    assert len(entregas) == 1
    consumidor = ConsumidorDedup()
    for evento in entregas:
        consumidor.receber(evento.chave, evento.intencao)
    assert consumidor.aplicados == 1


def test_fila_limitada_rejeita_overload() -> None:
    """AT-018/019 no recorte simulado: fila nunca passa da capacidade; overload é rejeitado."""
    fila = FilaLimitadaSimulada(capacidade=1)
    assert fila.admitir("a1") is True
    assert fila.admitir("a2") is False
    assert fila.admitir("a3") is False
    assert fila.profundidade_maxima <= 1
    assert fila.rejeitados == 2
    assert fila.consumir() == "a1"
    assert fila.sem_orfaos() is True


def test_timeout_cancela_operacao_possuida_sem_orfa() -> None:
    """AT-020/021 no recorte: timeout em ticks virtuais cancela com cleanup, sem órfã."""
    rede = RedeSimulada(seed=SEED)
    operacao = OperacaoSimulada(nome="op-020", inicio=rede.relogio(), prazo_ticks=5)
    assert operacao.expirar(rede.relogio()) is False
    rede.avancar(5)
    assert operacao.expirar(rede.relogio()) is True
    assert operacao.limpeza_executada is True
    assert operacao.finalizada is True


def test_cancelamento_externo_executa_cleanup_sem_orfaos() -> None:
    """AT-020 no recorte: cancelamento descarta pendentes com conta e sinaliza cleanup."""
    fila = FilaLimitadaSimulada(capacidade=2)
    assert fila.admitir("b1") is True
    assert fila.admitir("b2") is True
    assert fila.consumir() == "b1"
    fila.cancelar()
    assert fila.limpeza_executada is True
    assert fila.pendentes == 0
    assert fila.descartados == 1
    assert fila.sem_orfaos() is True


def _passo(nome: str, *, falha: bool = False, ordem: list[str]) -> PassoSaga:
    def executar() -> str:
        ordem.append(f"exec-{nome}")
        if falha:
            raise RuntimeError(f"falha em {nome}")
        return f"ok-{nome}"

    def compensar() -> str:
        ordem.append(f"comp-{nome}")
        return f"desfeito-{nome}"

    return PassoSaga(nome=nome, executar=executar, compensar=compensar)


def test_saga_compensa_em_ordem_inversa_auditavel() -> None:
    """Saga: falha no 3º passo desfaz o 2º e o 1º, nessa ordem, com log auditável."""
    rede = RedeSimulada(seed=SEED)
    caixa = CaixaDeSaida(agora=rede.relogio)
    ordem: list[str] = []
    saga = Saga(
        nome="matricula",
        passos=[
            _passo("reservar", ordem=ordem),
            _passo("cobrar", ordem=ordem),
            _passo("confirmar", falha=True, ordem=ordem),
        ],
    )
    with pytest.raises(RuntimeError, match="falha em confirmar"):
        saga.executar(caixa)
    assert ordem == [
        "exec-reservar",
        "exec-cobrar",
        "exec-confirmar",
        "comp-cobrar",
        "comp-reservar",
    ]
    assert [c["passo"] for c in caixa.compensacoes] == ["confirmar", "cobrar", "reservar"]
    assert [c["ordem"] for c in caixa.compensacoes] == [1, 2, 3]


def test_reentrega_apos_queda_simulada() -> None:
    """Queda após persistir sem publicar: recuperação republica o pendente sem duplicar."""
    diario: list[dict[str, Any]] = []
    caixa = CaixaDeSaida(diario=diario)
    caixa.persistir("k-a", "i-a", "e-a")
    assert caixa.publicar("k-a", "i-a").evento == "e-a"
    caixa.persistir("k-b", "i-b", "e-b")
    recuperada = CaixaDeSaida(diario=diario)
    assert recuperada.pendentes == 1
    reentregues = recuperada.reentregar()
    assert [(r.chave, r.intencao) for r in reentregues] == [("k-b", "i-b")]
    assert len(recuperada.entregues) == 2
    assert recuperada.publicar("k-a", "i-a") == recuperada.entregues[("k-a", "i-a")]
    assert len(recuperada.publicados) == 2
    assert recuperada.pendentes == 0


def test_seed_fixa_reproduz_roteiro() -> None:
    """Mesma seed e mesmo roteiro produzem o mesmo diário, ordem e digest."""

    def roteiro() -> str:
        rede = RedeSimulada(seed=SEED, perda=("k-x",), duplicar=("k-y",), atraso=("k-z",))
        rede.transmitir("k-x", "i", "cx")
        rede.transmitir("k-y", "i", "cy")
        rede.transmitir("k-z", "i", "cz")
        assert rede.pendentes == 3
        rede.avancar(10)
        entregas = rede.colher()
        detalhe = ",".join(f"{e.chave}#{e.tentativa}" for e in entregas)
        return f"{rede.digest()}:{detalhe}"

    primeira, segunda = roteiro(), roteiro()
    assert primeira == segunda
    assert primeira.split(":")[1].count("k-y") == 2
    assert "k-x" not in primeira
