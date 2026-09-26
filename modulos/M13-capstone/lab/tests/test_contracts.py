"""B10: contratos OpenAPI congelados, Problem Details, MCP local e A2A mínimo.

Tudo em processo, sem rede real: MCP usa framing JSON-RPC sobre bytes;
clientes "independentes" chamam o servidor apenas pelo protocolo.
"""

import json
from pathlib import Path

import pytest

from capstone_lab.contracts import (
    OPENAPI_SPEC,
    A2aHost,
    McpServer,
    decode_frames,
    encode_frame,
    make_problem,
    openapi_breaking_diffs,
    validate_problem_details,
)

GOLDEN = Path(__file__).parent.parent / "fixtures" / "contracts" / "openapi.v1.golden.json"


def test_openapi_spec_matches_frozen_golden() -> None:
    assert openapi_breaking_diffs(OPENAPI_SPEC, GOLDEN) == []


def test_breaking_change_is_detected() -> None:
    mutated = json.loads(json.dumps(OPENAPI_SPEC))
    del mutated["paths"]["/v1/search"]
    assert openapi_breaking_diffs(mutated, GOLDEN) != []


def test_spec_declares_pagination_and_problem_details() -> None:
    params = OPENAPI_SPEC["paths"]["/v1/search"]["get"]["parameters"]
    assert {p["name"] for p in params} == {"q", "cursor", "limit"}
    schemas = OPENAPI_SPEC["components"]["schemas"]
    assert schemas["SearchPage"]["required"] == ["items", "next_cursor"]
    pd = schemas["ProblemDetails"]
    assert pd["required"] == ["type", "title", "status", "detail", "instance"]


def test_problem_details_valid_and_invalid() -> None:
    ok = make_problem(404, "abstenção", "score abaixo do threshold", "/v1/search")
    assert validate_problem_details(ok) == []
    bad = {"title": "sem os demais campos"}
    errors = validate_problem_details(bad)
    assert len(errors) == 4  # type, status, detail, instance ausentes
    wrong = make_problem(404, "t", "d", "i") | {"status": "404"}
    assert "status deve ser inteiro" in validate_problem_details(wrong)


def mcp_server() -> McpServer:
    return McpServer(tools={"search": lambda args: {"hits": [args.get("q")]}})


def test_mcp_full_handshake_via_frames() -> None:
    server = mcp_server()
    wire = b"".join(  # cliente independente fala apenas o protocolo, em bytes
        encode_frame(msg)
        for msg in [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            {
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {"name": "search", "arguments": {"q": "bm25"}},
            },
        ]
    )
    requests, rest = decode_frames(wire)
    assert rest == b""
    responses = [server.handle(req) for req in requests]
    assert responses[0]["result"]["protocolVersion"] == "2025-06-18"
    names = [t["name"] for t in responses[1]["result"]["tools"]]
    assert names == ["search"]
    payload = json.loads(responses[2]["result"]["content"][0]["text"])
    assert payload == {"hits": ["bm25"]}


def test_mcp_rejects_non_jsonrpc_and_unknown_method() -> None:
    server = mcp_server()
    assert server.handle({"id": 1, "method": "x"})["error"]["code"] == -32600
    resp = server.handle({"jsonrpc": "2.0", "id": 2, "method": "inexistente"})
    assert resp["error"]["code"] == -32601
    resp2 = server.handle(
        {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {"name": "fantasma", "arguments": {}},
        }
    )
    assert resp2["error"]["code"] == -32601


def test_mcp_partial_frame_waits_for_more_bytes() -> None:
    frame = encode_frame({"jsonrpc": "2.0", "id": 1, "method": "initialize"})
    msgs, rest = decode_frames(frame[:-3])  # truncado
    assert msgs == [] and rest == frame[:-3]


def test_a2a_agent_card_and_task_lifecycle() -> None:
    host = A2aHost()
    card = host.agent_card()
    assert card["name"] == "cartografo"
    task = host.submit({"skill": "search", "q": "grafo"})
    assert task.status == "submitted"
    done = host.run(task, lambda msg: f"ok:{msg['q']}")
    assert done.status == "completed"
    assert done.artifacts[0]["data"] == "ok:grafo"
    with pytest.raises(ValueError, match="já processada"):
        host.run(done, lambda _: None)  # task não é reprocessável


def test_a2a_failure_becomes_explicit_state() -> None:
    host = A2aHost()
    task = host.submit({"skill": "search"})

    def boom(_: dict[str, str]) -> str:
        raise RuntimeError("falha real do handler")

    failed = host.run(task, boom)
    assert failed.status == "failed"
    assert "falha real do handler" in failed.artifacts[0]["detail"]
