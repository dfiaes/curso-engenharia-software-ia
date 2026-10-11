"""Every claim made in the lesson's code samples is pinned here."""

import itertools
from dataclasses import FrozenInstanceError
from datetime import date
from pathlib import Path

import pytest

from design_lab.exemplos import b01_legivel as b01
from design_lab.exemplos import b02_poo as b02
from design_lab.exemplos import b03_funcional as b03
from design_lab.exemplos import b04_solid as b04
from design_lab.exemplos import b05_padroes as b05

# --- block 1 -------------------------------------------------------------------------------


def test_guard_clauses_preservam_o_comportamento() -> None:
    for pago, dias, valor, papel in itertools.product(
        (True, False), (1, 30, 31), (100, 50_000, 50_001), ("agente", "supervisor")
    ):
        r = b01.Reembolso(pago, dias, valor)
        assert b01.decidir(r, papel) == b01.decidir_aninhado(r, papel)


def test_importar_separa_calculo_de_efeito(capsys: pytest.CaptureFixture[str]) -> None:
    linhas = ["café;12,50", "sem valor;", ";3,00", "pão;1.25", "lixo"]
    assert b01.importar(linhas) == (1375, ["sem valor;", ";3,00", "lixo"])
    assert capsys.readouterr().out == ""
    assert b01.importar_misturado(linhas) == 1375
    assert capsys.readouterr().out.count("linha ignorada") == 3


# --- block 2 -------------------------------------------------------------------------------


def test_classe_base_fragil_conta_errado_quando_a_base_muda() -> None:
    v1, v2 = b02.ContadaPorHerancaV1(), b02.ContadaPorHerancaV2()
    v1.adicionar_varios(["a", "b", "c"])
    v2.adicionar_varios(["a", "b", "c"])
    assert (v1.total, v2.total) == (6, 3)  # the correct answer is 3
    assert v1.itens == v2.itens == ["a", "b", "c"]


@pytest.mark.parametrize("base", [b02.ColecaoV1, b02.ColecaoV2])
def test_composicao_conta_certo_com_qualquer_base(base: type[b02.Armazem]) -> None:
    c = b02.ContadaPorComposicao(base())
    c.adicionar_varios(["a", "b", "c"])
    c.adicionar("d")
    assert c.total == 4


def test_mro_e_super_cooperativo() -> None:
    assert b02.nomes_mro(b02.Servico) == ["Servico", "Auditoria", "Cache", "Base", "object"]
    assert b02.Servico().passos() == ["Servico", "Auditoria", "Cache", "Base"]


def test_um_elo_sem_super_corta_a_cadeia_em_silencio() -> None:
    assert b02.ServicoComEloQuebrado().passos() == [
        "ServicoComEloQuebrado",
        "Auditoria",
        "Quebrado",
    ]


def test_mro_inconsistente_falha_na_criacao_da_classe() -> None:
    assert b02.tentar_mro_inconsistente().startswith(
        "Cannot create a consistent method resolution order (MRO) for bases Base, Auditoria"
    )


def test_name_mangling_evita_colisao_nao_garante_privacidade() -> None:
    c = b02.ContaPoupanca(100)
    c.depositar(50)
    assert c.n_movimentos() == 2
    assert c.historico_da_subclasse() == [-1]
    assert sorted(a for a in vars(c) if "historico" in a) == [
        "_ContaPoupanca__historico",
        "_Conta__historico",
    ]
    assert c._Conta__historico == [100, 150]  # type: ignore[attr-defined]


def test_abc_falha_na_instanciacao_protocol_runtime_so_olha_o_nome() -> None:
    assert "abstract method 'enviar'" in b02.instanciar_incompleto()
    assert isinstance(b02.AssinaturaErrada(), b02.NotificadorProtocol)  # name only: wrong signature


# --- block 3 -------------------------------------------------------------------------------


def test_funcao_impura_depende_de_estado_oculto() -> None:
    assert b03.somar_impuro(5) != b03.somar_impuro(5)
    assert b03.somar_puro(0, 5) == b03.somar_puro(0, 5) == 5
    assert b03.idade(date(2000, 6, 15), date(2026, 6, 14)) == 25
    assert b03.idade(date(2000, 6, 15), date(2026, 6, 15)) == 26


def test_imutabilidade_rasa() -> None:
    p = b03.Ponto(1, 2)
    assert b03.deslocar(p, 5) == b03.Ponto(6, 2)
    assert p == b03.Ponto(1, 2)
    with pytest.raises(FrozenInstanceError):
        p.x = 9  # type: ignore[misc]
    raso = b03.Raso([1])
    raso.itens.append(2)  # frozen does not reach inside
    assert raso.itens == [1, 2]
    with pytest.raises(TypeError):
        b03.CONFIG["moeda"] = "USD"  # type: ignore[index]


def test_partial_compor_cache() -> None:
    assert b03.dez_por_cento(250) == 25
    assert b03.compor(lambda x: x + 1, lambda x: x * 10)(4) == 50
    assert b03.fib(80) == 23416728348467685


def test_lru_cache_congela_funcao_impura() -> None:
    primeira = b03.cotacao_cacheada("USD")
    assert b03.cotacao_cacheada("USD") == primeira
    assert b03.cotacao_cacheada.cache_info().hits >= 1
    b03.cotacao_cacheada.cache_clear()


def test_lru_cache_em_metodo_mantem_a_instancia_viva() -> None:
    assert b03.instancia_sobrevive_ao_cache() is True


def test_singledispatch_escolhe_pelo_tipo_do_primeiro_argumento() -> None:
    assert b03.descrever(3) == "inteiro 3"
    assert b03.descrever([1, 2]) == "lista de 2"
    assert b03.descrever(3.5) == "objeto float"
    assert b03.descrever(True) == "inteiro True"  # bool is an int


def test_pipeline() -> None:
    vendas = [
        b03.Venda("a", 100),
        b03.Venda("b", 300),
        b03.Venda("a", 250),
        b03.Venda("b", 999, cancelada=True),
    ]
    assert list(b03.faturamento_por_produto(vendas).items()) == [("a", 350), ("b", 300)]
    assert b03.saldo_acumulado([100, -30, 50]) == [100, 70, 120]


# --- block 4 -------------------------------------------------------------------------------


def test_srp_mesmo_resultado_em_pecas_separadas(tmp_path: Path) -> None:
    vendas = [b04.Venda("a", 1050), b04.Venda("b", 250)]
    junto = b04.RelatorioTudoJunto(vendas).gerar(tmp_path / "r.txt")
    assert junto == b04.formatar_relatorio(vendas)
    assert (tmp_path / "r.txt").read_text(encoding="utf-8") == junto
    assert b04.total_vendas(vendas) == 1300


def test_ocp_registro_equivale_a_cadeia_de_if() -> None:
    for tipo in ("pix", "cartao", "boleto"):
        assert b04.calcular_taxa(tipo, 10_000) == b04.taxa_com_cadeia(tipo, 10_000)
    with pytest.raises(ValueError, match="tipo desconhecido: ted"):
        b04.calcular_taxa("ted", 1)


def test_lsp_subtipo_que_endurece_a_precondicao_quebra_o_chamador() -> None:
    assert b04.fechar_compra(b04.Pagamento(), 5000) == "pago 5000"
    with pytest.raises(ValueError, match="acima do limite"):
        b04.fechar_compra(b04.PagamentoComLimite(), 5000)
    assert b04.PagamentoDeclaradoComLimite().pagar(5000) == b04.Recusado("acima do limite")
    assert b04.PagamentoDeclaradoComLimite().pagar(500) == "pago 500"


def test_isp_o_falso_minimo_basta() -> None:
    assert b04.saldo_ou_zero(b04.LeitorFalso({"a": 7}), "a") == 7
    assert b04.saldo_ou_zero(b04.LeitorFalso({}), "a") == 0


def test_dip_o_acoplado_nao_roda_sem_rede_o_invertido_roda() -> None:
    with pytest.raises(ConnectionError):
        b04.AlertaAcoplado().disparar("x@y")

    class Gravador:
        def __init__(self) -> None:
            self.enviados: list[tuple[str, str]] = []

        def enviar(self, destino: str, texto: str) -> None:
            self.enviados.append((destino, texto))

    g = Gravador()
    b04.Alerta(g).disparar("x@y")
    assert g.enviados == [("x@y", "limite excedido")]
    with pytest.raises(ConnectionError):
        b04.Alerta(b04.AdaptadorSmtp(b04.SmtpClient())).disparar("x@y")


# --- block 5 -------------------------------------------------------------------------------


def test_strategy_factory_periodo() -> None:
    nomes = ["bia", "Ana", "carlos"]
    assert b05.ordenar(nomes, "alfabetica") == ["Ana", "bia", "carlos"]
    assert b05.ordenar(nomes, "tamanho") == ["bia", "Ana", "carlos"]
    assert b05.criar_formatador("csv")({"a": 1, "b": 2}) == "a,1\nb,2"
    with pytest.raises(ValueError, match=r"disponíveis: \['csv', 'linha'\]"):
        b05.criar_formatador("xml")
    assert b05.Periodo.de_texto("2020-2024") == b05.Periodo(2020, 2024)


def test_adapter_e_composition_root() -> None:
    assert b05.montar_cobranca().cobrar("4111111111111111", 5000) == "cobrado"
    assert b05.montar_cobranca().cobrar("4111111111111111", 500_000) == "recusado"


def test_decorator_pattern_cache_evita_consulta_repetida() -> None:
    fonte = b05.FonteLenta()
    c = b05.ComCache(fonte)
    assert [c.obter("abc"), c.obter("abc"), c.obter("de")] == [3, 3, 2]
    assert fonte.consultas == 2


def test_decorador_repetir_preserva_metadados_e_repete() -> None:
    chamadas = {"n": 0}

    @b05.repetir(3, (ConnectionError,))
    def instavel() -> str:
        """doc original"""
        chamadas["n"] += 1
        if chamadas["n"] < 3:
            raise ConnectionError
        return "ok"

    assert instavel() == "ok"
    assert chamadas["n"] == 3
    assert instavel.__name__ == "instavel"
    assert instavel.__doc__ == "doc original"


def test_decorador_repetir_desiste_e_nao_captura_outras_excecoes() -> None:
    @b05.repetir(2, (ConnectionError,))
    def sempre_falha() -> None:
        raise ConnectionError("x")

    with pytest.raises(ConnectionError):
        sempre_falha()

    @b05.repetir(5, (ConnectionError,))
    def erro_de_programacao() -> None:
        raise KeyError("y")

    with pytest.raises(KeyError):
        erro_de_programacao()


def test_ordem_de_aplicacao_de_decoradores_empilhados() -> None:
    assert b05.ordem_de_aplicacao() == ["b aplicado", "a aplicado", "a(b(base))"]


def test_observer_isola_falha_de_assinante() -> None:
    barramento = b05.Barramento()
    vistos: list[object] = []

    def ruim(evento: str, carga: object) -> None:
        raise RuntimeError("boom")

    barramento.assinar("pedido", ruim)
    barramento.assinar("pedido", lambda e, c: vistos.append(c))
    barramento.publicar("pedido", 42)
    assert vistos == [42]
    assert len(barramento.falhas) == 1
