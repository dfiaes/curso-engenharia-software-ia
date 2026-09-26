"""IaC como dados: plano, drift, import/move e guarda de destroy, sem binario.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (re).
Manifests como dados; oraculos LT03-AT-030..034 sem terraform/OpenTofu real.
"""

from __future__ import annotations

import re

PADRAO_SECRETO = re.compile(r"(senha|secret|token|password|api[_-]?key)", re.IGNORECASE)
SANDBOX_AUTORIZADO = "course-lt03"


def plano(desejado: dict[str, str], observado: dict[str, str]) -> dict[str, list[str]]:
    """Diff declarado contra observado: criar, atualizar, destruir por endereco."""
    criar = sorted(e for e in desejado if e not in observado)
    destruir = sorted(e for e in observado if e not in desejado)
    atualizar = sorted(e for e in desejado if e in observado and desejado[e] != observado[e])
    return {"criar": criar, "atualizar": atualizar, "destruir": destruir}


def vazio(resultado: dict[str, list[str]]) -> bool:
    """Plano vazio converge: segundo plan apos apply nao contem mudanca."""
    return not resultado["criar"] and not resultado["atualizar"] and not resultado["destruir"]


def aplicar(desejado: dict[str, str], observado: dict[str, str]) -> dict[str, str]:
    """Apply intencional: observado passa a igualar o desejado versionado."""
    novo = dict(observado)
    mudancas = plano(desejado, observado)
    for endereco in mudancas["destruir"]:
        del novo[endereco]
    novo.update(desejado)
    return novo


def detectar_drift(estado_arquivo: dict[str, str], real: dict[str, str]) -> list[str]:
    """Enderecos cujo real divergiu do estado arquivado, em ordem."""
    return sorted(e for e in estado_arquivo if real.get(e) != estado_arquivo[e])


def importar(estado: dict[str, str], endereco: str, id_externo: str) -> dict[str, str]:
    """Adota recurso preexistente sem recriar: registra o id sob o endereco."""
    novo = dict(estado)
    novo[endereco] = id_externo
    return novo


def mover(estado: dict[str, str], origem: str, destino: str) -> dict[str, str]:
    """Reendereca sem recriar: mesmo valor, nova chave, origem removida."""
    novo = dict(estado)
    novo[destino] = novo.pop(origem)
    return novo


def contem_segredo(objeto: dict[str, str]) -> bool:
    """True se chave ou valor carrega segredo: state e dado sensivel (AT-033)."""
    for chave, valor in objeto.items():
        if PADRAO_SECRETO.search(chave) or PADRAO_SECRETO.search(valor):
            return True
    return False


def destruir_permitido(alvo: str, sandbox: str = SANDBOX_AUTORIZADO) -> bool:
    """Destroy so no sandbox autorizado: resto recusado antes da acao (AT-034)."""
    return alvo == sandbox
