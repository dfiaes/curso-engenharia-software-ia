from __future__ import annotations

import json
import threading
import urllib.error
import urllib.request
from typing import Any

import pytest

from web_http_lab.api import (
    LabServer,
    NoteStore,
    etag_matches_strong,
    etag_matches_weak,
)
from web_http_lab.httpclient import Response, fetch, send_raw

JSON = {"Content-Type": "application/json"}


def call(
    server: LabServer,
    method: str,
    target: str,
    payload: object | None = None,
    headers: dict[str, str] | None = None,
) -> Response:
    body = b"" if payload is None else json.dumps(payload).encode()
    merged = {**(JSON if payload is not None else {}), **(headers or {})}
    return fetch("127.0.0.1", server.port, method, target, merged, body)


def create(server: LabServer, title: str, **headers: str) -> Response:
    return call(server, "POST", "/notes", {"title": title, "body": "x"}, headers)


def as_dict(response: Response) -> dict[str, Any]:
    data = response.json()
    assert isinstance(data, dict)
    return data


# ---- caminho feliz ----
def test_crud_round_trip(server: LabServer) -> None:
    created = create(server, "primeira")
    assert created.status == 201
    assert created.header("Location") == "/notes/1"
    assert created.header("Content-Type") == "application/json; charset=utf-8"
    assert as_dict(created) == {"id": 1, "title": "primeira", "body": "x", "href": "/notes/1"}

    got = call(server, "GET", "/notes/1")
    assert got.status == 200
    etag = got.header("ETag")
    assert etag is not None and etag.startswith('"')

    replaced = call(server, "PUT", "/notes/1", {"title": "editada"}, {"If-Match": etag})
    assert replaced.status == 200
    assert as_dict(replaced)["title"] == "editada"
    assert replaced.header("ETag") != etag

    assert call(server, "DELETE", "/notes/1").status == 204
    assert call(server, "GET", "/notes/1").status == 404


def test_conditional_get_returns_304_without_body(server: LabServer) -> None:
    create(server, "a")
    first = call(server, "GET", "/notes/1")
    etag = first.header("ETag")
    assert etag is not None
    second = call(server, "GET", "/notes/1", headers={"If-None-Match": etag})
    assert second.status == 304
    assert second.body == b""
    assert second.header("ETag") == etag
    assert second.header("Content-Type") is None
    weak = call(server, "GET", "/notes/1", headers={"If-None-Match": f"W/{etag}"})
    assert weak.status == 304


def test_negative_control_without_validator_or_with_stale_one_gets_200(server: LabServer) -> None:
    create(server, "a")
    old = call(server, "GET", "/notes/1").header("ETag")
    assert old is not None
    assert call(server, "GET", "/notes/1").status == 200
    call(server, "PUT", "/notes/1", {"title": "b"}, {"If-Match": old})
    again = call(server, "GET", "/notes/1", headers={"If-None-Match": old})
    assert again.status == 200
    assert as_dict(again)["title"] == "b"


def test_idempotency_key_replays_instead_of_duplicating(server: LabServer) -> None:
    first = create(server, "pagamento", **{"Idempotency-Key": "k-1"})
    second = create(server, "pagamento", **{"Idempotency-Key": "k-1"})
    assert (first.status, second.status) == (201, 201)
    assert first.body == second.body
    assert first.header("Idempotency-Replayed") is None
    assert second.header("Idempotency-Replayed") == "true"
    assert len(as_dict(call(server, "GET", "/notes"))["items"]) == 1


def test_negative_control_without_key_creates_duplicates(server: LabServer) -> None:
    create(server, "pagamento")
    create(server, "pagamento")
    assert len(as_dict(call(server, "GET", "/notes"))["items"]) == 2


def test_same_key_different_body_is_rejected(server: LabServer) -> None:
    create(server, "a", **{"Idempotency-Key": "k"})
    clash = create(server, "b", **{"Idempotency-Key": "k"})
    assert clash.status == 422
    assert as_dict(clash)["type"] == "/problems/idempotency-key-reuse"


def test_idempotency_key_is_atomic_under_concurrency(server: LabServer) -> None:
    results: list[int] = []

    def worker() -> None:
        results.append(create(server, "corrida", **{"Idempotency-Key": "same"}).status)

    threads = [threading.Thread(target=worker) for _ in range(12)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert results == [201] * 12
    assert len(as_dict(call(server, "GET", "/notes"))["items"]) == 1


# ---- bordas ----
def test_cursor_pagination_walks_all_pages_and_filters(server: LabServer) -> None:
    for i in range(5):
        create(server, f"nota {i}")
    seen: list[int] = []
    target: str | None = "/notes?limit=2"
    pages = 0
    while target:
        page = as_dict(call(server, "GET", target))
        seen += [item["id"] for item in page["items"]]
        target = page["next"]
        pages += 1
    assert seen == [1, 2, 3, 4, 5]
    assert pages == 3
    filtered = as_dict(call(server, "GET", "/notes?q=NOTA%203"))
    assert [item["id"] for item in filtered["items"]] == [4]


def test_cursor_is_stable_when_earlier_item_is_deleted(server: LabServer) -> None:
    for i in range(4):
        create(server, f"n{i}")
    page = as_dict(call(server, "GET", "/notes?limit=2"))
    call(server, "DELETE", "/notes/1")
    rest = as_dict(call(server, "GET", str(page["next"])))
    assert [item["id"] for item in rest["items"]] == [3, 4]


def test_server_header_has_no_trailing_space(server: LabServer) -> None:
    assert call(server, "GET", "/health").header("Server") == "web-http-lab/0.1"


def test_head_matches_get_headers_without_body(server: LabServer) -> None:
    create(server, "a")
    get = call(server, "GET", "/notes/1")
    head = call(server, "HEAD", "/notes/1")
    assert head.status == 200 and head.body == b""
    assert head.header("Content-Length") == get.header("Content-Length")
    assert head.header("ETag") == get.header("ETag")


def test_method_not_allowed_lists_allow(server: LabServer) -> None:
    response = call(server, "DELETE", "/notes")
    assert response.status == 405
    assert response.header("Allow") == "GET, HEAD, POST"
    assert response.header("Content-Type") == "application/problem+json"


def test_etag_comparison_rules() -> None:
    assert etag_matches_weak('W/"a", "b"', '"a"')
    assert etag_matches_weak("*", '"zzz"')
    assert not etag_matches_weak(None, '"a"')
    assert etag_matches_strong('"a"', '"a"')
    assert not etag_matches_strong('W/"a"', '"a"')
    assert etag_matches_strong("*", '"a"')


# ---- falhas ----
@pytest.mark.parametrize(
    ("raw", "status", "slug"),
    [
        (b"{not json", 400, "invalid-json"),
        (b'{"title": ""}', 422, "validation"),
        (b'{"title": "ok", "extra": 1}', 422, "validation"),
        (b"[1, 2]", 422, "validation"),
    ],
)
def test_bad_bodies_become_problem_details(
    server: LabServer, raw: bytes, status: int, slug: str
) -> None:
    response = fetch("127.0.0.1", server.port, "POST", "/notes", JSON, raw)
    assert response.status == status
    assert response.header("Content-Type") == "application/problem+json"
    problem = as_dict(response)
    assert problem["type"] == f"/problems/{slug}"
    assert problem["status"] == status
    assert problem["instance"] == "/notes"


def test_validation_lists_each_field(server: LabServer) -> None:
    response = call(server, "POST", "/notes", {"title": "", "body": 5, "x": 1})
    fields = {error["field"] for error in as_dict(response)["errors"]}
    assert fields == {"title", "body", "x"}


def test_wrong_content_type_is_415(server: LabServer) -> None:
    response = fetch(
        "127.0.0.1", server.port, "POST", "/notes", {"Content-Type": "text/plain"}, b'{"title":"a"}'
    )
    assert response.status == 415


def test_oversized_body_is_413_and_connection_closes(server: LabServer) -> None:
    response = fetch("127.0.0.1", server.port, "POST", "/notes", JSON, b" " * (64 * 1024 + 1))
    assert response.status == 413
    assert response.header("Connection") == "close"


def test_missing_content_length_is_411(server: LabServer) -> None:
    raw = send_raw(
        "127.0.0.1",
        server.port,
        (
            b"POST /notes HTTP/1.1\r\nHost: x\r\nConnection: close\r\n"
            b"Content-Type: application/json\r\n\r\n"
        ),
    )
    assert raw.startswith(b"HTTP/1.1 411 ")


def test_chunked_request_body_is_refused(server: LabServer) -> None:
    raw = send_raw(
        "127.0.0.1",
        server.port,
        (
            b"POST /notes HTTP/1.1\r\nHost: x\r\nConnection: close\r\n"
            b"Transfer-Encoding: chunked\r\n\r\n0\r\n\r\n"
        ),
    )
    assert raw.startswith(b"HTTP/1.1 501 ")


def test_malformed_request_line_gets_problem_not_html(server: LabServer) -> None:
    raw = send_raw("127.0.0.1", server.port, b"ISSO NAO E HTTP\r\n\r\n")
    assert b" 400 " in raw.split(b"\r\n", 1)[0]
    assert b"application/problem+json" in raw


def test_stale_if_match_is_412_and_missing_is_428(server: LabServer) -> None:
    create(server, "a")
    etag = call(server, "GET", "/notes/1").header("ETag")
    assert etag is not None
    ok = call(server, "PUT", "/notes/1", {"title": "b"}, {"If-Match": etag})
    stale = call(server, "PUT", "/notes/1", {"title": "c"}, {"If-Match": etag})
    assert (ok.status, stale.status) == (200, 412)
    assert as_dict(call(server, "GET", "/notes/1"))["title"] == "b"
    assert call(server, "PUT", "/notes/1", {"title": "d"}).status == 428
    assert call(server, "PUT", "/notes/1", {"title": "d"}, {"If-Match": f"W/{etag}"}).status == 412


def test_bad_query_parameters(server: LabServer) -> None:
    response = call(server, "GET", "/notes?limit=0&after=-1")
    assert response.status == 400
    assert {e["field"] for e in as_dict(response)["errors"]} == {"limit", "after"}


def test_unexpected_exception_is_500_without_leaking(
    server: LabServer, monkeypatch: pytest.MonkeyPatch
) -> None:
    def boom(self: NoteStore, note_id: int) -> dict[str, Any]:
        raise RuntimeError("senha do banco: hunter2")

    monkeypatch.setattr(NoteStore, "get", boom)
    response = call(server, "GET", "/notes/1")
    assert response.status == 500
    assert b"hunter2" not in response.body


# ---- um segundo cliente (urllib) concorda com o nosso ----
def test_urllib_sees_the_same_server(server: LabServer) -> None:
    base = f"http://127.0.0.1:{server.port}"
    with urllib.request.urlopen(f"{base}/health") as resp:
        assert resp.status == 200
        assert json.load(resp) == {"status": "ok"}
    with pytest.raises(urllib.error.HTTPError) as info:
        urllib.request.urlopen(f"{base}/notes/99")
    assert info.value.code == 404
    assert info.value.headers["Content-Type"] == "application/problem+json"
    assert json.load(info.value)["title"] == "Nota não encontrada"
