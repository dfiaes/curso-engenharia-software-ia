"""Oraculo LT01-AT-020: NXDOMAIN/timeout — camada identificada corretamente.

Nome inexistente rende NomeInexistente (resolucao, resposta de ausencia);
atraso local alem do prazo rende ResolucaoExpirada (prazo, ausencia de
resposta). Nunca "instabilidade da rede": registros distintos por camada.
Numeros: exemplo variavel (medicao local). So localhost/.invalid, sem rede
externa — resolver_local usa getaddrinfo local; o atraso e sleep local.
"""

from __future__ import annotations

import pytest

import resolucao_local as rl

PRAZO = 5.0


def test_localhost_resolve_sem_rede() -> None:
    enderecos = rl.resolver_local("localhost", PRAZO)
    assert enderecos
    assert all(isinstance(ip, str) and ip for ip in enderecos)
    assert any(ip.startswith("127.") or ip == "::1" for ip in enderecos)


def test_grafia_maiuscula_e_espacos_resolvem() -> None:
    assert rl.resolver_local("LOCALHOST", PRAZO)
    assert rl.resolver_local("  localhost  ", PRAZO)


def test_nome_fora_do_contrato_e_nxdomain_local() -> None:
    with pytest.raises(rl.NomeInexistente):
        rl.resolver_local("naoexiste.invalid", PRAZO)
    with pytest.raises(rl.NomeInexistente):
        rl.resolver_local("qualquer-outro-nome", PRAZO)
    with pytest.raises(ValueError, match="sem registro"):
        rl.resolver_local("naoexiste.invalid", PRAZO)


def test_hierarquia_nxdomain_e_valueerror() -> None:
    assert issubclass(rl.NomeInexistente, ValueError)


def test_prazo_nao_positivo_e_erro() -> None:
    with pytest.raises(ValueError, match="prazo"):
        rl.resolver_local("localhost", 0.0)
    with pytest.raises(ValueError, match="prazo"):
        rl.resolver_local("localhost", -1.0)


def test_hostname_vazio_nao_resolve() -> None:
    with pytest.raises(ValueError, match="vazio"):
        rl.resolver_local("   ", PRAZO)


def test_atraso_alem_do_prazo_vira_timeout() -> None:
    with pytest.raises(rl.ResolucaoExpirada):
        rl.resolver_com_atraso("localhost", 0.05, 0.3)
    assert issubclass(rl.ResolucaoExpirada, TimeoutError)


def test_atraso_dentro_do_prazo_resolve() -> None:
    enderecos = rl.resolver_com_atraso("localhost", PRAZO, 0.0)
    assert enderecos


def test_atraso_invalido_e_erro() -> None:
    with pytest.raises(ValueError, match="prazo"):
        rl.resolver_com_atraso("localhost", 0.0, 0.0)
    with pytest.raises(ValueError, match="prazo"):
        rl.resolver_com_atraso("localhost", PRAZO, -0.1)
