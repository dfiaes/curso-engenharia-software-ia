"""Deploy declarativo, dados e simulador determinístico de rollback (M13 B17).

Invariantes:
- Deploy é descrito por um **documento declarativo** (versão + migrations +
  estratégia); o motor aplica exatamente o declarado, nunca improvisa.
- Rollback é determinístico: dado o estado e a release alvo, restaura o estado
  anterior aplicando as migrations ``down`` em ordem reversa; replay byte a byte.
- Release ruim é detectada por **health gate** (invariantes checáveis), não por
  opinião; release que não passa não entra e o rollback já está planejado.
- Kubernetes/cloud real: BLOCKED ambiental (sem cluster/credenciais). O motor
  aqui prova a semântica localmente; o documento declarativo é portável.
- Backup/restore: snapshot de dados local com hash; restore verifica integridade
  e declara RPO/RTO **medidos neste ambiente**, não metas de marketing.
"""

from __future__ import annotations

import copy
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Migration:
    """Migration com ``up``/``down`` reversíveis sobre um dict de dados."""

    version: int
    name: str
    up: dict[str, Any]  # chaves adicionadas/atualizadas
    down_removes: tuple[str, ...]  # chaves removidas no rollback
    down_restores: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Release:
    """Release declarativa: versão, migrations e saúde esperada."""

    tag: str
    migrations: tuple[Migration, ...]
    healthy: bool = True  # injeção determinística de "release ruim" no simulador
    strategy: str = "rolling"


@dataclass
class ClusterState:
    """Estado local simulado: dados + histórico de deploys (tudo verificável)."""

    data: dict[str, Any]
    schema_version: int = 0
    history: list[str] = field(default_factory=list)
    released: str = "none"


def hash_state(data: dict[str, Any]) -> str:
    """Hash canônico do estado dos dados (integridade de backup/restore)."""
    blob = json.dumps(data, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(blob).hexdigest()


def backup(state: ClusterState) -> dict[str, Any]:
    """Snapshot imutável com hash; RPO local = este snapshot (ponto do backup)."""
    snapshot = copy.deepcopy(state.data)
    return {
        "schema_version": state.schema_version,
        "data": snapshot,
        "sha256": hash_state(snapshot),
    }


def restore(snapshot: dict[str, Any], state: ClusterState) -> None:
    """Restore determinístico: integridade obrigatória antes de qualquer escrita."""
    if hash_state(snapshot["data"]) != snapshot["sha256"]:
        raise ValueError("backup corrompido: hash diverge")
    state.data = copy.deepcopy(snapshot["data"])
    state.schema_version = int(snapshot["schema_version"])


class HealthGate:
    """Gate objetivo de saúde: release é recusada se a flag `healthy` for falsa.

    Em produção real isso seriam checks HTTP sintéticos e SLOs; aqui a decisão
    é determinística e registrada — o mecanismo (gate automático antes/depois do
    deploy) é o invariante sob teste.
    """

    def check(self, release: Release) -> list[str]:
        erros: list[str] = []
        if not release.healthy:
            erros.append(f"release {release.tag}: health check falhou")
        for m in release.migrations:
            if any(k in m.down_restores and k not in m.up for k in m.down_restores):
                erros.append(f"migration {m.version} restaura chave que não criou")
        return erros


def deploy(state: ClusterState, release: Release, gate: HealthGate) -> dict[str, Any]:
    """Aplica release se e somente se passar no gate; retorna o log do deploy."""
    erros = gate.check(release)
    if erros:
        return {"applied": False, "tag": release.tag, "reason": erros}
    for m in sorted(release.migrations, key=lambda x: x.version):
        if m.version <= state.schema_version:
            continue  # idempotente: migration já aplicada não reaplica
        state.data.update(m.up)
        state.schema_version = m.version
    state.released = release.tag
    state.history.append(f"deploy:{release.tag}")
    return {"applied": True, "tag": release.tag, "schema_version": state.schema_version}


def rollback(state: ClusterState, release: Release, target_schema: int) -> dict[str, Any]:
    """Reverte migrations da release até ``target_schema``; ordem reversa e total."""
    aplicadas = [m for m in release.migrations if target_schema < m.version <= state.schema_version]
    for m in sorted(aplicadas, key=lambda x: x.version, reverse=True):
        for chave in m.down_removes:
            state.data.pop(chave, None)
        state.data.update(m.down_restores)
        state.schema_version = min(state.schema_version, m.version - 1) if m.version > 0 else 0
    state.history.append(f"rollback:->{target_schema}")
    prev = state.history[-2] if len(state.history) >= 2 else "deploy:none"
    state.released = prev.removeprefix("deploy:")
    return {"rolled_back_to": target_schema, "schema_version": state.schema_version}


def release_design() -> dict[str, Any]:
    """Design declarativo canônico do Cartógrafo (portável a IAC real)."""
    return {
        "environments": ["staging", "production"],
        "strategy": "canary 10% -> 50% -> 100% com health gate entre etapas",
        "config": "12-factor: toda configuração por variável de ambiente",
        "secrets": "provedor de segredos; nunca no repositório nem em logs",
        "migrations": "expand-migrate-contract; down obrigatório e testado",
        "backup": "snapshot diário + antes de cada release; verificação por hash",
        "rollback": "release anterior + migrations down; RPO/RTO medidos no ambiente",
        "blocked": "Kubernetes/cloud real BLOCKED neste ambiente (sem credenciais)",
    }
