"""Unit tests of the refactored pieces, each without the others."""

from datetime import date

import pytest

from design_lab.pedidos.descontos import (
    CUPONS,
    Efeito,
    combinar,
    efeito_cliente,
    efeito_cupom,
    efeito_data,
    efeito_volume,
)
from design_lab.pedidos.frete import (
    TabelaRegional,
    aplicar_isencao,
    calcular_frete,
    regiao_de,
)
from design_lab.pedidos.modelos import Cliente, Item, Pedido, Regiao, TipoCliente
from design_lab.pedidos.precificacao import calcular

REGULAR = Cliente(TipoCliente.REGULAR, 3)


def pedido(
    *itens: Item,
    cliente: Cliente = REGULAR,
    uf: str = "SP",
    cupom: str | None = None,
    expresso: bool = False,
) -> Pedido:
    return Pedido(itens, cliente, uf, cupom, expresso)


def test_modelos_rejeitam_estados_invalidos() -> None:
    with pytest.raises(ValueError, match="quantidade inválida: X"):
        Item("X", 100, 0, 10)
    with pytest.raises(ValueError, match="pedido vazio"):
        Pedido((), REGULAR, "SP")


def test_item_e_imutavel() -> None:
    with pytest.raises(AttributeError):
        Item("X", 100, 1, 10).qtd = 5  # type: ignore[misc]


@pytest.mark.parametrize(
    ("tipo", "pedidos", "esperado"),
    [("ouro", 0, 10), ("prata", 0, 5), ("regular", 10, 2), ("regular", 9, 0)],
)
def test_efeito_cliente(tipo: str, pedidos: int, esperado: int) -> None:
    assert efeito_cliente(Cliente(TipoCliente(tipo), pedidos)).percentual == esperado


@pytest.mark.parametrize(("qtd", "esperado"), [(1, 0), (9, 0), (10, 3), (49, 3), (50, 7)])
def test_efeito_volume_nas_bordas(qtd: int, esperado: int) -> None:
    assert efeito_volume(qtd).percentual == esperado


def test_efeito_data_so_na_black_friday() -> None:
    assert efeito_data(date(2026, 11, 28)).avisos == ("black friday",)
    assert efeito_data(date(2026, 11, 27)) == Efeito()


def test_combinar_soma_percentuais_e_preserva_ordem_dos_avisos() -> None:
    soma = combinar((Efeito(percentual=3, avisos=("a",)), Efeito(percentual=4, avisos=("b",))))
    assert soma.percentual == 7
    assert soma.avisos == ("a", "b")
    assert combinar(()) == Efeito()


def test_registro_de_cupons_e_cupom_desconhecido() -> None:
    assert set(CUPONS) == {"PRIMEIRA", "FIXO20", "FRETEGRATIS"}
    assert efeito_cupom("PROMO", REGULAR, 100).avisos == ("cupom inválido: PROMO",)
    assert efeito_cupom(None, REGULAR, 100) == Efeito()


@pytest.mark.parametrize(
    ("uf", "regiao"),
    [("SP", Regiao.SUDESTE), ("RS", Regiao.SUL), ("BA", Regiao.OUTRAS), ("sp", Regiao.OUTRAS)],
)
def test_regiao_de(uf: str, regiao: Regiao) -> None:
    assert regiao_de(uf) is regiao


def test_tabela_regional_arredonda_o_peso_para_cima() -> None:
    t = TabelaRegional(base=1000, por_kg_extra=100)
    assert [t.calcular(p) for p in (0, 1000, 1001, 2500)] == [1000, 1000, 1100, 1200]


def test_estrategia_de_frete_pode_ser_trocada_por_um_stub() -> None:
    class Fixa:
        def calcular(self, peso_g: int) -> int:
            return 777

    p = pedido(Item("A", 1000, 1, 100))
    frete = calcular_frete(
        p,
        base_pos_desconto=1000,
        cupom_frete_gratis=False,
        tabelas={Regiao.SUDESTE: Fixa(), Regiao.SUL: Fixa(), Regiao.OUTRAS: Fixa()},
    )
    assert frete == 777


def test_isencao_nao_vale_para_expresso_sem_cupom() -> None:
    kw = {"base_pos_desconto": 30000, "cupom_frete_gratis": False}
    assert aplicar_isencao(1500, expresso=False, **kw) == 0  # type: ignore[arg-type]
    assert aplicar_isencao(3000, expresso=True, **kw) == 3000  # type: ignore[arg-type]


def test_perecivel_fora_do_alcance_falha_com_mensagem() -> None:
    p = pedido(Item("P", 1000, 1, 100, perecivel=True), uf="BA")
    with pytest.raises(ValueError, match="perecível não é entregue em BA"):
        calcular_frete(p, base_pos_desconto=1000, cupom_frete_gratis=False)


def test_calcular_e_puro_mesmo_pedido_mesma_resposta() -> None:
    p = pedido(Item("A", 5000, 2, 700), uf="PR")
    hoje = date(2026, 3, 10)
    assert calcular(p, hoje) == calcular(p, hoje)
    assert calcular(p, hoje).para_dict() == {
        "subtotal": 10000,
        "desconto": 0,
        "frete": 2700,
        "total": 12700,
        "avisos": [],
    }
