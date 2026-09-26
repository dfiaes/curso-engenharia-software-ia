"""Oraculo LT03-AT-014: dado duravel fora do container; aborto preserva a versao.

Numeros: exemplo variavel (dados em memoria). Amostra: desejadas 3,
sequencia [True, False, False] aborta com removidas < desejadas.
Sem cluster, sem rede: volumes como dicts; reinicio nunca prova durabilidade.
"""

from __future__ import annotations

import simular_rollout as sr

VOLUME_DURAVEL: dict[str, object] = {
    "nome": "dados-banco",
    "classe": "padrao-exemplo",
    "reclaim": "reter",
    "vida": "além-do-pod",
    "montagem": "/var/lib/dados",
}

VOLUME_EFEMERO: dict[str, object] = {
    "nome": "rascunho-container",
    "classe": "efemera",
    "reclaim": "apagar-com-pod",
    "vida": "ciclo-do-container",
    "montagem": "/tmp/rascunho",
}

DESEJADAS = 3


def persiste_alem_do_pod(volume: dict[str, object]) -> bool:
    """Duravel exige vida alem do Pod, classe nomeada e reclaim que retem."""
    return bool(
        volume.get("vida") == "além-do-pod"
        and str(volume.get("classe", "")).strip()
        and volume.get("reclaim") == "reter"
    )


def test_dado_que_precisa_sobreviver_mora_fora_do_container() -> None:
    assert persiste_alem_do_pod(VOLUME_DURAVEL) is True
    assert VOLUME_DURAVEL["montagem"] != "/tmp/rascunho"


def test_volume_efemero_assumido_persistente_e_recusado() -> None:
    assert persiste_alem_do_pod(VOLUME_EFEMERO) is False


def test_reinicio_nao_confunde_efemero_com_persistencia() -> None:
    assert persiste_alem_do_pod(VOLUME_EFEMERO) is False
    assert persiste_alem_do_pod(VOLUME_DURAVEL) is True


def test_rollout_aborta_antes_de_100_com_versao_antiga_preservada() -> None:
    veredito = sr.simular(DESEJADAS, [True, False, False], 0)
    assert veredito["concluiu"] is False
    removidas = veredito["removidas"]
    assert isinstance(removidas, int) and removidas < DESEJADAS
    preservadas = DESEJADAS - removidas
    assert preservadas >= 1


def test_passo_nao_remove_alem_do_restante() -> None:
    veredito = sr.passo(3, 3, DESEJADAS, 0)
    assert veredito["removiveis"] == 0
