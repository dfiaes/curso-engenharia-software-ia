"""MCP: discovery, schema, erros, escopo e capability (AT-001..008,010)."""

from __future__ import annotations

import pytest

from proto_lab import jsonrpc
from proto_lab.demo import montar_servidor
from proto_lab.mcp_client import ClienteMCP
from proto_lab.mcp_server import PROTOCOL_VERSION, RequestContext
from proto_lab.transports import MemoryChannel

CTX_LEITURA = RequestContext(scopes=frozenset({"repo:ler"}), capabilities=frozenset())


def _cliente() -> ClienteMCP:
    return ClienteMCP(MemoryChannel(montar_servidor(), CTX_LEITURA))


def test_discovery_lista_tools_resources_prompts() -> None:
    cliente = _cliente()
    nomes = {t["name"] for t in cliente.listar_tools()["tools"]}
    assert {
        "repo_buscar_simbolo",
        "repo_ler_trecho",
        "repo_impacto",
        "repo_perguntar_usuario",
    } <= nomes
    assert cliente.ler_resource("repo://demo/arquitetura")["contents"][0]["text"].startswith("#")


def test_call_executa_e_estrutura() -> None:
    cliente = _cliente()
    resultado = cliente.chamar_tool("repo_buscar_simbolo", {"simbolo": "calcular_total"})
    assert resultado["content"][0]["text"]
    assert "calcular_total" in str(resultado)


def test_tool_inexistente_da_32601() -> None:
    with pytest.raises(RuntimeError, match="32601"):
        _cliente().chamar_tool("nao_existe", {})


def test_schema_rejeita_antes_de_executar() -> None:
    with pytest.raises(RuntimeError, match="32602"):
        _cliente().chamar_tool("repo_buscar_simbolo", {"limite": 5})


def test_escopo_insuficiente_nega() -> None:
    with pytest.raises(RuntimeError, match="32001"):
        _cliente().chamar_tool("repo_impacto", {"simbolo": "x"})


def test_capability_ausente_nunca_aciona() -> None:
    with pytest.raises(RuntimeError, match="32002"):
        _cliente().chamar_tool("repo_perguntar_usuario", {})


def test_versao_invalida_rejeitada() -> None:
    servidor = montar_servidor()
    resposta = servidor.dispatch(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
            "params": {"_meta": {"protocolVersion": "1999-01-01"}},
        },
        CTX_LEITURA,
    )
    assert resposta["error"]["code"] == jsonrpc.PROTOCOL_VERSION_MISMATCH
    assert PROTOCOL_VERSION == "2026-07-28"


def test_prompt_rende_template() -> None:
    canal = MemoryChannel(montar_servidor(), CTX_LEITURA)
    resposta = canal.roundtrip(
        {
            "jsonrpc": "2.0",
            "id": 7,
            "method": "prompts/get",
            "params": {"name": "analisar-impacto", "arguments": {"simbolo": "X"}},
        }
    )
    assert "X" in resposta["result"]["messages"][0]["content"]
