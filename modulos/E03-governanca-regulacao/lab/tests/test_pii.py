import io
import logging
from pathlib import Path

import pytest

from aigov.cli import main
from aigov.pii import PiiKind, RedactingFilter, is_valid_cpf, redact, scan

from .conftest import EXAMPLES

VALID_CPF = "529.982.247-25"


def kinds(text: str) -> list[PiiKind]:
    return [m.kind for m in scan(text)]


def test_cpf_check_digits() -> None:
    assert is_valid_cpf("52998224725")
    assert is_valid_cpf("11144477735")
    assert not is_valid_cpf("52998224726")  # wrong last digit
    assert not is_valid_cpf("11111111111")  # repeated digits pass the arithmetic, are rejected
    assert not is_valid_cpf("1234567890")  # too short
    assert not is_valid_cpf("abcdefghijk")


def test_cpf_formatted_and_plain_are_found() -> None:
    assert kinds(f"cpf {VALID_CPF}") == [PiiKind.CPF]
    assert kinds("cpf 52998224725.") == [PiiKind.CPF]


def test_invalid_cpf_is_not_redacted() -> None:
    text = "protocolo 12345678901 e 529.982.247-26"
    assert redact(text) == text


def test_known_limit_valid_looking_id_is_redacted() -> None:
    # An 11-digit id that happens to pass the check digits is indistinguishable from a CPF.
    assert redact("order=52998224725") == "order=[CPF]"


def test_email_found_and_non_email_ignored() -> None:
    assert redact("falhou para ana.lima@example.com status=502") == "falhou para [EMAIL] status=502"
    assert redact("mencione @ana e user@localhost") == "mencione @ana e user@localhost"


@pytest.mark.parametrize(
    "text",
    ["(71) 99999-8888", "71999998888", "+55 71 99999-8888", "(11) 3333-4444", "+55 71 3333-4444"],
)
def test_phone_formats(text: str) -> None:
    assert redact(f"ligar {text} agora") == "ligar [TELEFONE] agora"


@pytest.mark.parametrize(
    "text",
    [
        "ts=1760174060000",  # epoch in milliseconds
        "versao 3.14.7",
        "R$ 1.234,56",
        "ip 192.168.0.1",
        "data 2026-10-11",
        "id 1133334444",  # 10 digits without separators: not accepted as landline
    ],
)
def test_false_positive_controls(text: str) -> None:
    assert redact(text) == text


def test_cpf_wins_over_phone_when_both_could_match() -> None:
    # 11 digits starting with DDD 91 + "9": phone-shaped. With valid check digits it is a CPF too.
    candidate = next(c for n in range(9 * 10**8, 10**9) if is_valid_cpf(c := f"91{n:09d}"))
    assert kinds(candidate) == [PiiKind.CPF]
    phone_only = "91988887777"  # check digits fail, still phone-shaped
    assert not is_valid_cpf(phone_only)
    assert kinds(phone_only) == [PiiKind.PHONE]


def test_scan_never_stores_the_value() -> None:
    (m,) = scan(f"cpf {VALID_CPF}")
    assert VALID_CPF not in repr(m)
    assert (m.start, m.end) == (4, 18)


def test_keyed_redaction_is_stable_and_format_independent() -> None:
    key = b"k" * 16
    a = redact("a 529.982.247-25", key=key)
    b = redact("b 52998224725", key=key)
    assert a[2:] == b[2:] and a.startswith("a [CPF:")
    assert redact("x 529.982.247-25", key=b"other-key-0123456") != redact(
        "x 529.982.247-25", key=key
    )
    assert VALID_CPF not in a


def test_email_hash_ignores_case() -> None:
    key = b"k" * 16
    assert redact("Ana@Example.com", key=key) == redact("ana@example.com", key=key)


def test_redacting_filter_cleans_message_and_args() -> None:
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    handler.addFilter(RedactingFilter())
    log = logging.getLogger("aigov.test")
    log.handlers = [handler]
    log.propagate = False
    log.setLevel(logging.INFO)
    log.info("cliente %s ligou de %s", "ana@example.com", "(71) 99999-8888")
    assert stream.getvalue() == "cliente [EMAIL] ligou de [TELEFONE]\n"


def test_filter_limit_traceback_text_is_not_covered() -> None:
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    handler.addFilter(RedactingFilter())
    log = logging.getLogger("aigov.test2")
    log.handlers = [handler]
    log.propagate = False
    try:
        raise ValueError("falhou para ana@example.com")
    except ValueError:
        log.exception("erro")
    assert "ana@example.com" in stream.getvalue()  # documents the gap, does not endorse it


def test_cli_scan_and_redact(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    log = EXAMPLES / "sample.log"
    assert main(["scan", str(log)]) == 1
    out = capsys.readouterr().out
    assert "total: 5 CPF=2 EMAIL=1 TELEFONE=2" in out
    assert "529" not in out and "ana.lima" not in out
    monkeypatch.setattr("sys.stdin", io.StringIO(log.read_text(encoding="utf-8")))
    assert main(["redact"]) == 0
    red = capsys.readouterr().out
    assert "[CPF]" in red and "order.created id=12345678901" in red


def test_cli_scan_clean_and_missing(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    f = tmp_path / "clean.log"
    f.write_text("tudo certo\n", encoding="utf-8")
    assert main(["scan", str(f)]) == 0
    assert main(["scan", str(tmp_path / "nope.log")]) == 2
