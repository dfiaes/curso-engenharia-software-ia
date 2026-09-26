"""Oraculo LT03-AT-010: estado declarado converge; rollout so avanca sobre readiness.

Numeros: exemplo variavel (dados em memoria, sem tempo). Amostra fixa:
desejadas 3, max_indisponiveis 0, sequencia [True, True, True] conclui.
Sem cluster, sem rede: manifestos sao dicts, nunca aplicados.
"""

from __future__ import annotations

import simular_rollout as sr
import validar_manifesto as vm

API_APROVADA: dict[str, object] = {
    "nome": "api-exemplo",
    "especificacao": {
        "conteineres": [
            {
                "nome": "api",
                "sondas": {"prontidao": "http-/pronto", "vivacidade": "http-/vivo"},
                "recursos": {
                    "pedido": {"cpu": "100m", "memoria": "128Mi"},
                    "teto": {"cpu": "500m", "memoria": "256Mi"},
                },
                "env": [{"nome": "NIVEL_LOG", "valor": "info"}],
            }
        ]
    },
}

DESEJADAS = 3
MAX_INDISPONIVEIS = 0


def test_manifesto_aprovado_converge_sem_violacoes() -> None:
    rel = vm.relatorio([API_APROVADA])
    assert rel["aprovado"] is True
    assert rel["violacoes"] == []


def test_probe_obrigatoria_ausente_reprova_isolado() -> None:
    sem_prontidao: dict[str, object] = {
        "nome": "api-sem-prontidao",
        "especificacao": {
            "conteineres": [
                {
                    "nome": "api",
                    "sondas": {"vivacidade": "http-/vivo"},
                    "recursos": {
                        "pedido": {"cpu": "100m", "memoria": "128Mi"},
                        "teto": {"cpu": "500m", "memoria": "256Mi"},
                    },
                    "env": [],
                }
            ]
        },
    }
    rel = vm.relatorio([sem_prontidao])
    assert rel["aprovado"] is False
    violacoes = rel["violacoes"]
    assert isinstance(violacoes, list) and len(violacoes) == 1


def test_recursos_nao_declarados_reprovam_isolado() -> None:
    sem_recursos: dict[str, object] = {
        "nome": "api-sem-recursos",
        "especificacao": {
            "conteineres": [
                {
                    "nome": "api",
                    "sondas": {"prontidao": "x", "vivacidade": "y"},
                    "env": [],
                }
            ]
        },
    }
    rel = vm.relatorio([sem_recursos])
    assert rel["aprovado"] is False


def test_segredo_em_env_reprova_isolado() -> None:
    com_segredo: dict[str, object] = {
        "nome": "api-com-segredo",
        "especificacao": {
            "conteineres": [
                {
                    "nome": "api",
                    "sondas": {"prontidao": "x", "vivacidade": "y"},
                    "recursos": {
                        "pedido": {"cpu": "100m", "memoria": "128Mi"},
                        "teto": {"cpu": "500m", "memoria": "256Mi"},
                    },
                    "env": [{"nome": "SENHA_BANCO", "valor": "referencia-montada"}],
                }
            ]
        },
    }
    assert vm.expoe_segredo_em_env({"env": [{"nome": "TOKEN_API", "valor": "x"}]}) is True
    rel = vm.relatorio([com_segredo])
    assert rel["aprovado"] is False


def test_rollout_conclui_quando_toda_replica_fica_pronta() -> None:
    veredito = sr.simular(DESEJADAS, [True, True, True], MAX_INDISPONIVEIS)
    assert veredito["concluiu"] is True
    assert veredito["removidas"] == DESEJADAS


def test_trava_de_readiness_absoluta_sem_pronta_nada_sai() -> None:
    veredito = sr.passo(0, 0, DESEJADAS, 1)
    assert veredito["removiveis"] == 0
    simulado = sr.simular(DESEJADAS, [False, False, False], MAX_INDISPONIVEIS)
    assert simulado["concluiu"] is False
    assert simulado["removidas"] == 0
