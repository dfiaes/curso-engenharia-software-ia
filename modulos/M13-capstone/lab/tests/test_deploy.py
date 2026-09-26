"""B17: deploy declarativo, health gate, backup/restore e rollback determinístico."""

from capstone_lab.deploy import (
    ClusterState,
    HealthGate,
    Migration,
    Release,
    backup,
    deploy,
    hash_state,
    release_design,
    restore,
    rollback,
)

M1 = Migration(1, "cria_indice", {"idx_symbols": ["a.py"]}, ("idx_symbols",))
M2 = Migration(2, "adiciona_tabela", {"audit_log": []}, ("audit_log",))
M3 = Migration(3, "muda_cfg", {"cfg": "v2"}, ("cfg",), {"cfg": "v1"})


def _estado() -> ClusterState:
    return ClusterState(data={"cfg": "v1"})


def test_deploy_aplica_migrations_em_ordem_e_idempotente() -> None:
    st = _estado()
    rel = Release("1.0.0", (M1, M2))
    r1 = deploy(st, rel, HealthGate())
    assert r1["applied"] and st.schema_version == 2 and "idx_symbols" in st.data
    r2 = deploy(st, rel, HealthGate())
    assert r2["applied"] and st.schema_version == 2  # migrations não reaplicam
    assert st.data["idx_symbols"] == ["a.py"]


def test_release_ruim_reprovada_por_health_gate() -> None:
    st = _estado()
    ruim = Release("9.9.9", (M1,), healthy=False)
    res = deploy(st, ruim, HealthGate())
    assert res["applied"] is False
    assert "health check" in res["reason"][0]
    assert st.released == "none" and st.schema_version == 0  # nada parcial


def test_rollback_deterministico_restaura_estado() -> None:
    st = _estado()
    antes = hash_state(st.data)
    rel = Release("1.1.0", (M1, M2, M3))
    deploy(st, rel, HealthGate())
    assert st.schema_version == 3
    rb = rollback(st, rel, 0)
    assert rb["schema_version"] == 0
    assert hash_state(st.data) == antes  # bytes do estado idênticos ao inicial
    assert st.history[-1] == "rollback:->0"


def test_backup_restore_com_hash_e_integridade() -> None:
    st = _estado()
    deploy(st, Release("1.0.0", (M1,)), HealthGate())
    snap = backup(st)
    assert snap["sha256"] == hash_state(snap["data"])
    # estrago "real" nos dados:
    st.data.clear()
    assert st.schema_version >= 0
    restore(snap, st)
    assert hash_state(st.data) == snap["sha256"]
    corrompido = {"schema_version": 1, "data": {"cfg": "hackeado"}, "sha256": snap["sha256"]}
    st.data.clear()
    try:
        restore(corrompido, st)
        raise AssertionError("restore aceitou backup corrompido")
    except ValueError as e:
        assert "hash" in str(e)


def test_release_design_declarativo_completo() -> None:
    design = release_design()
    chaves = ("environments", "strategy", "config", "secrets", "migrations", "backup", "rollback")
    for chave in chaves:
        assert chave in design
    assert "canary" in design["strategy"]
    assert "BLOCKED" in design["blocked"]
