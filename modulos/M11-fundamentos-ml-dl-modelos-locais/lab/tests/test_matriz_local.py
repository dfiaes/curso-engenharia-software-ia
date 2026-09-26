"""Oraculos AT-030-032 + AT-034-035: matriz, formato, LoRA e break-even.

Tudo local, sem modelo/servidor/rede/pesos. Taxas, latencias e custos
abaixo sao DADOS DECLARADOS COMO EXEMPLO (estrutura do benchmark
honesto, nao medida): a prova e a estrutura — mesma carga declarada,
p50/p95 por config, fronteira declarada — mais a aritmetica exata
(taxa, tabela, break-even, fracao LoRA).
"""

import json

from matriz_local import ConfigExec, ResultadoExec, break_even, tabela_markdown

FRONTEIRA = "hw=exemplo-24gb gpu; quant=Q4_K_M/Q8_0; ctx=8192; conc=1; v0.1"
"""Fronteira declarada como exemplo: sem ela o numero nao e reproduzivel."""


def _tool_json_schema() -> dict[str, object]:
    """Doc da tool em JSON Schema (dict puro): o formato que o BFCL mede."""
    return {
        "name": "ler_arquivo",
        "description": "Le o conteudo de um arquivo do repositorio.",
        "parameters": {
            "type": "object",
            "properties": {"caminho": {"type": "string"}},
            "required": ["caminho"],
        },
    }


def _tool_assinatura_python() -> str:
    """Mesma tool documentada como assinatura Python (texto, sem schema)."""
    return "def ler_arquivo(caminho: str) -> str: ..."


def test_formato_json_schema_eh_estrutura_parseavel() -> None:
    """AT-030: JSON Schema e dict com type/properties/required; round-trip."""
    doc = _tool_json_schema()
    params = doc["parameters"]
    assert isinstance(params, dict)
    assert params["type"] == "object"
    assert "caminho" in params["properties"]
    assert params["required"] == ["caminho"]
    assert json.loads(json.dumps(doc)) == doc


def test_formato_python_nao_carrega_schema() -> None:
    """AT-030: assinatura Python nao expoe campos/tipos sem parse ad-hoc."""
    doc = _tool_assinatura_python()
    assert "caminho" in doc  # mesma informacao, formato sem estrutura
    assert "required" not in doc and '"type"' not in doc


def test_par_modelo_formato_registrado_por_linha() -> None:
    """AT-030: o eval mede o par (modelo, formato): uma linha por formato."""
    cfg_a = ConfigExec("local", "local-8b-q4+json-schema", "Q4_K_M")
    cfg_b = ConfigExec("local", "local-8b-q4+python-sig", "Q4_K_M")
    linhas = [
        ResultadoExec(cfg_a, 7, 10, 1200.0, 2100.0, 0.012),
        ResultadoExec(cfg_b, 7, 10, 1200.0, 2100.0, 0.012),
    ]
    t = tabela_markdown(linhas)
    assert "local-8b-q4+json-schema" in t and "local-8b-q4+python-sig" in t
    assert len(t.splitlines()) == 4  # cabecalho + separador + 2 configs


def test_escada_trocar_modelo_eh_o_ultimo_degrau() -> None:
    """AT-031: escada de 8 degraus como dado; trocar de modelo e o degrau 8."""
    escada = [
        "template",
        "contexto",
        "suporte-tools",
        "formato-doc",
        "stop-tokens",
        "quant",
        "menos-tools",
        "trocar-modelo",
    ]
    assert len(escada) == 8 and escada[-1] == "trocar-modelo"
    assert escada.index("formato-doc") < escada.index("trocar-modelo")


def test_taxa_fracao_e_zero_sem_casos() -> None:
    """AT-032: taxa e fracao exata; sem casos rende 0.0."""
    cfg = ConfigExec("api", "ref", None)
    assert ResultadoExec(cfg, 7, 10, 900.0, 1500.0, 0.030).taxa == 0.7
    assert ResultadoExec(cfg, 0, 0, 0.0, 0.0, 0.0).taxa == 0.0


def test_tabela_colunas_e_precisao() -> None:
    """AT-032: cabecalho fixo; taxa 3 casas, p50/p95 1 casa, custo 4 casas."""
    r = ResultadoExec(ConfigExec("api", "ref", None), 7, 10, 900.0, 1500.0, 0.03)
    linha = tabela_markdown([r]).splitlines()[2]
    assert linha.startswith("| api | ref | - | 0.700 | 900.0 | 1500.0 | 0.0300 |")
    assert r.p50 <= r.p95  # mesma carga: p95 nunca abaixo do p50


def test_lora_posto16_fica_abaixo_de_um_porcento() -> None:
    """AT-034: fracao treinavel 2r/D por matriz quadrada; r=16, D=4096."""
    r, dim = 16, 4096
    fracao = 2 * r / dim  # (d*r + r*k) / (d*k) com d=k=D
    assert fracao == 32 / 4096
    assert fracao < 0.01  # menos de 1% treinavel, sem treino
    assert 2 * 32 / dim >= 0.01  # r=32 ja estoura 1% nesta D: posto nao e graca


def test_lora_e_degrau_6_de_6() -> None:
    """AT-034: fine-tuning e o ultimo degrau; resolve formato, nao fatos."""
    degraus = ["prompt", "structured", "rag", "ferramenta", "modelo-maior", "lora"]
    assert degraus[-1] == "lora" and len(degraus) == 6
    resolve = "comportamento/formato em altissimo volume"
    assert "fato" not in resolve  # fato novo entra por RAG/ferramenta


def test_break_even_aritmetica_exata_e_fronteira() -> None:
    """AT-035: (api, local, veredito) exatos no volume declarado."""
    api, local, veredito = break_even(100, 8000, 3.00, 4.24, 111.11)
    assert api == 0.8 * 3.00
    assert local == 111.11 + 0.8 * 4.24
    assert veredito == "api"
    assert "ctx=8192" in FRONTEIRA  # fronteira declarada acompanha a tabela
