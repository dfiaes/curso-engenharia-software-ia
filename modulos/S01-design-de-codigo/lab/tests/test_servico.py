"""Service tests with every kind of test double, and a contract suite for the repository."""

from collections.abc import Iterator
from datetime import date
from unittest import mock

import pytest

from design_lab.pedidos.modelos import Cliente, Item, Pedido, TipoCliente
from design_lab.pedidos.repositorio import (
    PedidoCalculado,
    PedidoJaExiste,
    RepositorioEmMemoria,
    RepositorioPedidos,
    RepositorioSqlite,
)
from design_lab.pedidos.servico import Relogio, ServicoPedidos

DIA = date(2026, 3, 10)
PEDIDO = Pedido((Item("A", 5000, 1, 500),), Cliente(TipoCliente.REGULAR, 3), "SP")


class RelogioFixo:  # stub: canned answer
    def __init__(self, dia: date = DIA) -> None:
        self._dia = dia

    def hoje(self) -> date:
        return self._dia


class Espiao:  # spy: records how it was called
    def __init__(self) -> None:
        self.recebidos: list[PedidoCalculado] = []

    def __call__(self, registro: PedidoCalculado) -> None:
        self.recebidos.append(registro)


class RepositorioQueFalha:  # failure injection
    def salvar(self, registro: PedidoCalculado) -> None:
        raise OSError("disco cheio")

    def obter(self, pedido_id: str) -> PedidoCalculado | None:
        return None

    def listar_do_dia(self, dia: date) -> list[PedidoCalculado]:
        return []


def servico(
    repo: RepositorioPedidos, relogio: Relogio | None = None, *ouvintes: Espiao
) -> ServicoPedidos:
    return ServicoPedidos(repo, relogio or RelogioFixo(), ouvintes)


def test_fechar_calcula_grava_e_notifica() -> None:
    repo, espiao = RepositorioEmMemoria(), Espiao()
    resultado = servico(repo, None, espiao).fechar("p1", PEDIDO)
    assert resultado.total == 6500
    assert repo.obter("p1") == PedidoCalculado("p1", resultado, DIA)
    assert [r.pedido_id for r in espiao.recebidos] == ["p1"]


def test_dummy_ouvintes_nao_sao_necessarios() -> None:
    assert servico(RepositorioEmMemoria()).fechar("p1", PEDIDO).total == 6500


def test_a_data_vem_do_relogio_injetado() -> None:
    repo = RepositorioEmMemoria()
    servico(repo, RelogioFixo(date(2026, 11, 28))).fechar("bf", PEDIDO)
    registro = repo.obter("bf")
    assert registro is not None
    assert registro.resultado.avisos == ("black friday",)


def test_pedido_repetido_e_recusado_e_nao_notifica_de_novo() -> None:
    repo, espiao = RepositorioEmMemoria(), Espiao()
    s = servico(repo, None, espiao)
    s.fechar("p1", PEDIDO)
    with pytest.raises(PedidoJaExiste):
        s.fechar("p1", PEDIDO)
    assert len(espiao.recebidos) == 1


def test_falha_do_repositorio_propaga_e_ninguem_e_notificado() -> None:
    espiao = Espiao()
    with pytest.raises(OSError, match="disco cheio"):
        servico(RepositorioQueFalha(), None, espiao).fechar("p1", PEDIDO)
    assert espiao.recebidos == []


def test_falha_no_ouvinte_deixa_o_pedido_gravado() -> None:
    repo = RepositorioEmMemoria()

    def ouvinte_quebrado(registro: PedidoCalculado) -> None:
        raise RuntimeError("fila fora do ar")

    s = ServicoPedidos(repo, RelogioFixo(), [ouvinte_quebrado])
    with pytest.raises(RuntimeError):
        s.fechar("p1", PEDIDO)
    assert repo.obter("p1") is not None  # saved, then the listener failed


def test_mock_so_onde_a_interacao_e_o_comportamento() -> None:
    repo = mock.create_autospec(RepositorioPedidos, instance=True)
    servico(repo).fechar("p1", PEDIDO)
    repo.salvar.assert_called_once()
    assert repo.salvar.call_args.args[0].pedido_id == "p1"


def test_mock_com_autospec_recusa_metodo_que_nao_existe() -> None:
    repo = mock.create_autospec(RepositorioPedidos, instance=True)
    with pytest.raises(AttributeError):
        repo.salvar_tudo()


# --- contract tests: the fake and the real adapter must be indistinguishable ---------------


@pytest.fixture(params=["memoria", "sqlite"])
def repositorio(request: pytest.FixtureRequest) -> Iterator[RepositorioPedidos]:
    if request.param == "memoria":
        yield RepositorioEmMemoria()
    else:
        repo = RepositorioSqlite()
        yield repo
        repo.fechar()


def registro(pedido_id: str, dia: date = DIA) -> PedidoCalculado:
    from design_lab.pedidos.precificacao import calcular

    return PedidoCalculado(pedido_id, calcular(PEDIDO, dia), dia)


def test_contrato_ida_e_volta(repositorio: RepositorioPedidos) -> None:
    r = registro("p1", date(2026, 11, 28))
    repositorio.salvar(r)
    assert repositorio.obter("p1") == r


def test_contrato_inexistente_devolve_none(repositorio: RepositorioPedidos) -> None:
    assert repositorio.obter("nada") is None


def test_contrato_id_duplicado(repositorio: RepositorioPedidos) -> None:
    repositorio.salvar(registro("p1"))
    with pytest.raises(PedidoJaExiste, match="p1"):
        repositorio.salvar(registro("p1"))


def test_contrato_listagem_do_dia_ordenada_por_id(repositorio: RepositorioPedidos) -> None:
    for pid, dia in [("b", DIA), ("a", DIA), ("c", date(2026, 3, 11))]:
        repositorio.salvar(registro(pid, dia))
    assert [r.pedido_id for r in repositorio.listar_do_dia(DIA)] == ["a", "b"]
    assert repositorio.listar_do_dia(date(2030, 1, 1)) == []
