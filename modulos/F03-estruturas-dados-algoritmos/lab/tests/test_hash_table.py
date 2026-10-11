import random

import pytest

from algos.hash_table import OpenAddressingTable, probe_sequence


class SameHash:
    """Control: every instance collides, so lookups degrade to a linear scan."""

    def __init__(self, value: int) -> None:
        self.value = value

    def __hash__(self) -> int:
        return 7

    def __eq__(self, other: object) -> bool:
        return isinstance(other, SameHash) and self.value == other.value


class ExplodingEq:
    """Fault injection: same hash as the stored key, but comparing it raises."""

    def __hash__(self) -> int:
        return hash("victim")

    def __eq__(self, other: object) -> bool:
        raise RuntimeError("eq blew up")


class MutableKey:
    def __init__(self, n: int) -> None:
        self.n = n

    def __hash__(self) -> int:
        return hash(self.n)

    def __eq__(self, other: object) -> bool:
        return isinstance(other, MutableKey) and self.n == other.n


def test_set_get_update_delete() -> None:
    t: OpenAddressingTable[str, int] = OpenAddressingTable()
    t["a"] = 1
    t["b"] = 2
    t["a"] = 10
    assert t["a"] == 10 and len(t) == 2
    assert "b" in t and "z" not in t
    del t["b"]
    assert "b" not in t and len(t) == 1
    assert t.get("b", None) is None
    with pytest.raises(KeyError):
        t["b"]
    with pytest.raises(KeyError):
        del t["b"]


def test_probe_sequence_visits_every_slot_of_a_power_of_two_table() -> None:
    # perturb (64 bits, shifted right by 5 per step) is 0 after 13 steps; from then on the
    # recurrence is a full-period LCG, so within 13 + 64 steps every slot has been visited
    for h in (0, 1, 12345, -7, 2**63 + 5):
        seen = {i for _, i in zip(range(13 + 64), probe_sequence(h, 63), strict=False)}
        assert len(seen) == 64


def test_grows_and_keeps_load_below_two_thirds() -> None:
    t: OpenAddressingTable[int, int] = OpenAddressingTable()
    for i in range(1_000):
        t[i] = i * i
        assert t.load_factor <= 2 / 3 + 1e-9
    assert t.capacity >= 1_500
    assert all(t[i] == i * i for i in range(1_000))


def test_tombstones_keep_chains_reachable_and_are_purged_by_rebuild() -> None:
    t: OpenAddressingTable[int, int] = OpenAddressingTable()
    for i in range(200):
        t[i] = i
    for i in range(0, 200, 2):
        del t[i]
    assert t.tombstones == 100
    assert all(t[i] == i for i in range(1, 200, 2))
    for i in range(1_000, 1_400):  # inserts eventually trigger a rebuild
        t[i] = i
    assert t.tombstones < 100


def test_deleting_the_head_of_a_collision_chain_keeps_the_tail_reachable() -> None:
    t: OpenAddressingTable[SameHash, int] = OpenAddressingTable()
    keys = [SameHash(i) for i in range(5)]
    for i, k in enumerate(keys):
        t[k] = i
    del t[keys[0]]  # the first link of the probe chain becomes a tombstone, not an empty slot
    assert keys[0] not in t
    assert [t[k] for k in keys[1:]] == [1, 2, 3, 4]


def test_reinsert_after_delete_reuses_a_tombstone() -> None:
    t: OpenAddressingTable[int, str] = OpenAddressingTable()
    t[1] = "x"
    del t[1]
    assert t.tombstones == 1
    t[1] = "y"
    assert t.tombstones == 0 and t[1] == "y"


def test_random_operations_match_dict() -> None:
    rng = random.Random(3)
    mine: OpenAddressingTable[int, int] = OpenAddressingTable()
    ref: dict[int, int] = {}
    for step in range(20_000):
        key = rng.randrange(500)
        if rng.random() < 0.6:
            mine[key] = step
            ref[key] = step
        elif key in ref:
            del mine[key]
            del ref[key]
        assert len(mine) == len(ref)
    assert dict(mine.items()) == ref
    assert set(mine) == set(ref)


def test_unhashable_key_raises_type_error_and_leaves_table_unchanged() -> None:
    t: OpenAddressingTable[object, int] = OpenAddressingTable()
    t["ok"] = 1
    with pytest.raises(TypeError):
        t[[1, 2]] = 2
    assert len(t) == 1 and [1, 2] not in t


def test_failing_eq_propagates_and_does_not_corrupt() -> None:
    t: OpenAddressingTable[object, int] = OpenAddressingTable()
    t["victim"] = 1
    with pytest.raises(RuntimeError):
        t[ExplodingEq()] = 2
    assert len(t) == 1 and t["victim"] == 1


def test_control_same_hash_degrades_to_linear_probing_cost() -> None:
    good: OpenAddressingTable[int, int] = OpenAddressingTable()
    bad: OpenAddressingTable[SameHash, int] = OpenAddressingTable()
    keys = [SameHash(i) for i in range(300)]
    for i, k in enumerate(keys):
        good[i] = i
        bad[k] = i
    assert max(good.probes(i) for i in range(300)) <= 12
    assert bad.probes(keys[-1]) >= 300  # still correct, but every key sits on one chain
    assert bad[keys[-1]] == 299


def test_control_mutating_a_key_after_insertion_loses_it() -> None:
    t: OpenAddressingTable[MutableKey, str] = OpenAddressingTable()
    k = MutableKey(1)
    t[k] = "v"
    k.n = 2  # hash changed under the table's feet
    assert k not in t
    assert len(t) == 1  # the entry is still there, just unreachable by this key
