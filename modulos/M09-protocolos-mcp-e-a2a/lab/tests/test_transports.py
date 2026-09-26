"""Transportes, timeout, replay e cliente independente (AT-009/011/012)."""

from __future__ import annotations

import pytest

from proto_lab.client2 import ClienteIndependente
from proto_lab.demo import montar_servidor
from proto_lab.mcp_client import ClienteMCP
from proto_lab.mcp_server import RequestContext, assinar_estado, verificar_estado
from proto_lab.transports import HttpLocal, MemoryChannel, StdioProcess, TransportTimeout


def test_memoria_economica() -> None:
    ctx = RequestContext(scopes=frozenset({"repo:ler"}))
    cliente = ClienteMCP(MemoryChannel(montar_servidor(), ctx))
    assert "calcular_total" in str(
        cliente.chamar_tool("repo_buscar_simbolo", {"simbolo": "calcular_total"})
    )


def test_stdio_subprocesso_real() -> None:
    proc = StdioProcess.iniciar()
    try:
        cliente = ClienteMCP(proc)
        nomes = {t["name"] for t in cliente.listar_tools()["tools"]}
        assert "repo_buscar_simbolo" in nomes
        resultado = cliente.chamar_tool("repo_buscar_simbolo", {"simbolo": "fechar_pedido"})
        assert "fechar_pedido" in str(resultado)
    finally:
        erros = proc.encerrar()
    assert "Traceback" not in erros


def test_http_local_com_token_e_origem() -> None:
    http = HttpLocal(montar_servidor(), {"tok-acme": frozenset({"repo:ler"})})
    try:
        negado = http.roundtrip(
            "tools/call", {"name": "repo_impacto", "arguments": {"simbolo": "x"}}, token="tok-acme"
        )
        assert negado["error"]["code"] == -32001  # token sem escopo de escrita
        import urllib.request

        corpo = b'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
        pedido = urllib.request.Request(
            http.url,
            data=corpo,
            headers={"Content-Type": "application/json", "Origin": "https://evil.example"},
            method="POST",
        )
        with pytest.raises(Exception) as exc:
            urllib.request.urlopen(pedido, timeout=5.0)
        assert "403" in str(exc.value)
    finally:
        http.encerrar()


def test_timeout_observavel() -> None:
    proc = StdioProcess.iniciar()
    try:
        with pytest.raises(TransportTimeout):
            proc.roundtrip("tools/list", {}, timeout_s=0.0001)
    finally:
        proc.encerrar()


def test_estado_adulterado_rejeitado() -> None:
    token = assinar_estado("repo_perguntar_usuario:[]")
    assert verificar_estado(token) is not None
    assert verificar_estado(token[:-2] + ("00" if not token.endswith("00") else "ff")) is None
    assert verificar_estado("lixo-sem-formato") is None


def test_mrtr_retomada_com_estado() -> None:
    ctx = RequestContext(scopes=frozenset({"repo:ler"}), capabilities=frozenset({"interacao"}))
    canal = MemoryChannel(montar_servidor(), ctx)
    primeira = canal.roundtrip(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": "repo_perguntar_usuario", "arguments": {}},
        }
    )
    assert primeira["result"]["resultType"] == "input_required"
    estado = primeira["result"]["state"]
    segunda = canal.roundtrip(
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "repo_perguntar_usuario",
                "arguments": {},
                "input_responses": {"x": 1},
                "state": estado,
            },
        }
    )
    assert segunda["result"]["content"][0]["text"] == "{'ok': True}"


def test_cliente_independente_no_mesmo_contrato() -> None:
    ctx = RequestContext(scopes=frozenset({"repo:ler"}))
    outro = ClienteIndependente(MemoryChannel(montar_servidor(), ctx))
    assert "repo_buscar_simbolo" in outro.ferramentas()
    resultado = outro.chamar("repo_buscar_simbolo", {"simbolo": "calcular_total"})
    assert "calcular_total" in str(resultado)
