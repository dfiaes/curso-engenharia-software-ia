from __future__ import annotations

import signal
import subprocess
import sys
from pathlib import Path

import pytest

from shell_git_lab.pgrep import select_lines

CMD = [sys.executable, "-m", "shell_git_lab.pgrep"]


def run(*args: str, stdin: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [*CMD, *args], input=stdin, capture_output=True, text=True, check=False, timeout=30
    )


def test_match_goes_to_stdout_with_exit_0() -> None:
    result = run("b", stdin="a\nb\nbb\n")
    assert (result.returncode, result.stdout, result.stderr) == (0, "b\nbb\n", "")


def test_no_match_is_exit_1_not_an_error() -> None:
    result = run("zzz", stdin="a\nb\n")
    assert (result.returncode, result.stdout, result.stderr) == (1, "", "")


def test_missing_file_is_exit_2_and_message_only_on_stderr(tmp_path: Path) -> None:
    result = run("x", str(tmp_path / "nao-existe.txt"))
    assert result.returncode == 2
    assert result.stdout == ""
    assert "No such file or directory" in result.stderr


def test_missing_file_does_not_hide_matches_in_other_files(tmp_path: Path) -> None:
    good = tmp_path / "ok.txt"
    good.write_text("alvo\n", encoding="utf-8")
    result = run("alvo", str(tmp_path / "falta.txt"), str(good))
    assert result.returncode == 2
    assert result.stdout == f"{good}:alvo\n"


def test_invalid_regex_is_exit_2() -> None:
    result = run("(", stdin="x\n")
    assert result.returncode == 2
    assert "expressão inválida" in result.stderr


def test_options_count_invert_number_ignore_case() -> None:
    text = "Foo\nbar\nfoo\n"
    assert run("-c", "-i", "foo", stdin=text).stdout == "2\n"
    assert run("-v", "foo", stdin=text).stdout == "Foo\nbar\n"
    assert run("-n", "foo", stdin=text).stdout == "3:foo\n"


def test_binary_file_is_skipped_with_notice(tmp_path: Path) -> None:
    blob = tmp_path / "x.bin"
    blob.write_bytes(b"abc\0abc\n")
    result = run("abc", str(blob))
    assert result.returncode == 1
    assert "binário" in result.stderr


def test_crlf_keeps_carriage_return_so_dollar_anchor_misses(tmp_path: Path) -> None:
    crlf = tmp_path / "win.txt"
    crlf.write_bytes(b"fim\r\n")
    assert run("fim$", str(crlf)).returncode == 1
    assert run(r"fim\r$", str(crlf)).returncode == 0


def test_select_lines_pure_function() -> None:
    import re

    pattern = re.compile("a")
    assert list(select_lines([b"a\n", b"b\n"], pattern)) == [(1, "a")]
    assert list(select_lines([b"a\n", b"b\n"], pattern, invert=True)) == [(2, "b")]


def test_closed_pipe_returns_141(tmp_path: Path) -> None:
    big = tmp_path / "big.txt"
    big.write_text("linha\n" * 400_000, encoding="utf-8")
    proc = subprocess.Popen(
        [*CMD, "linha", str(big)], stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    assert proc.stdout is not None
    assert proc.stderr is not None
    assert proc.stdout.readline() == b"linha\n"
    proc.stdout.close()  # like `| head -1` exiting early
    assert proc.wait(timeout=30) == 141
    assert proc.stderr.read() == b""
    proc.stderr.close()


@pytest.mark.skipif(sys.platform == "win32", reason="SIGINT por sinal é semântica POSIX")
def test_sigint_returns_130() -> None:
    proc = subprocess.Popen(
        [*CMD, "--line-buffered", "a"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert proc.stdin is not None
    assert proc.stdout is not None
    proc.stdin.write(b"alpha\n")
    proc.stdin.flush()
    assert proc.stdout.readline() == b"alpha\n"  # prova que o loop de leitura está ativo
    proc.send_signal(signal.SIGINT)
    assert proc.wait(timeout=30) == 130
    proc.stdin.close()
    proc.stdout.close()
    assert proc.stderr is not None
    proc.stderr.close()
