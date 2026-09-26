"""Oraculo LT01-AT-011: symlink/path escape — negado antes de I/O sensivel.

Amostra fixa em tmp_path: base com arquivo interno + carneirinho fora da
base com sentinela conhecida. Pedido interno e lido; ".." e symlink ao
carneirinho levantam EscapeNegado sem jamais devolver o conteudo externo.
Sem rede, sem Docker, qualquer plataforma. Cleanup: tmp_path do pytest.
"""

from __future__ import annotations

from pathlib import Path

import pytest

import caminho_seguro as cs

SENTINELA_FORA = b"carneirinho-externo-nunca-lido"
CONTEUDO_DENTRO = b"dentro-da-base"


def _cenario(tmp_path: Path) -> tuple[str, str]:
    base = tmp_path / "base"
    base.mkdir()
    (base / "dentro.txt").write_bytes(CONTEUDO_DENTRO)
    carneirinho = tmp_path / "fora.txt"
    carneirinho.write_bytes(SENTINELA_FORA)
    return str(base), str(carneirinho)


def test_pedido_interno_resolve_e_le(tmp_path: Path) -> None:
    base, _ = _cenario(tmp_path)
    destino = cs.resolver_confinado(base, "dentro.txt")
    assert destino.startswith(str(Path(base).resolve()))
    assert cs.ler_confinado(base, "dentro.txt") == CONTEUDO_DENTRO


def test_raiz_resolve_para_si_mesma(tmp_path: Path) -> None:
    base, _ = _cenario(tmp_path)
    assert cs.resolver_confinado(base, ".") == str(Path(base).resolve())


def test_dotdot_para_carneirinho_negado_antes_de_ler(tmp_path: Path) -> None:
    base, _ = _cenario(tmp_path)
    with pytest.raises(cs.EscapeNegado):
        cs.resolver_confinado(base, "../fora.txt")
    with pytest.raises(cs.EscapeNegado):
        cs.ler_confinado(base, "../fora.txt")


def test_symlink_ao_carneirinho_negado_antes_de_ler(tmp_path: Path) -> None:
    base, carneirinho = _cenario(tmp_path)
    elo = Path(base) / "elo"
    elo.symlink_to(carneirinho)
    with pytest.raises(cs.EscapeNegado):
        cs.resolver_confinado(base, "elo")
    with pytest.raises(cs.EscapeNegado):
        cs.ler_confinado(base, "elo")
    assert Path(carneirinho).read_bytes() == SENTINELA_FORA


def test_pedido_absoluto_externo_negado(tmp_path: Path) -> None:
    base, _ = _cenario(tmp_path)
    with pytest.raises(cs.EscapeNegado):
        cs.resolver_confinado(base, "/etc/hostname")


def test_escape_negado_e_valueerror() -> None:
    assert issubclass(cs.EscapeNegado, ValueError)
