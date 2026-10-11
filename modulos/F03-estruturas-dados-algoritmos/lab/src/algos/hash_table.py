"""Hash table with open addressing, using the probe recurrence of CPython's ``dict``.

Collisions are resolved inside the table itself: a colliding key goes to another slot of the
same array, chosen by a deterministic sequence that depends on the full hash. Deleting leaves a
tombstone so later keys of the same probe chain stay reachable.
"""

from collections.abc import Iterator
from typing import Final

_MASK64: Final = (1 << 64) - 1
_PERTURB_SHIFT: Final = 5
_MIN_CAPACITY: Final = 8
_MAX_LOAD: Final = 2 / 3  # live entries + tombstones above this fraction trigger a rebuild
_REBUILD_LOAD: Final = 0.5  # a rebuilt table is at most half full


class _Tombstone:
    __slots__ = ()

    def __repr__(self) -> str:
        return "<tombstone>"


_TOMBSTONE: Final = _Tombstone()


def probe_sequence(hash_value: int, mask: int) -> Iterator[int]:
    """Yield slot indexes for a hash. ``i = 5*i + 1 + perturb`` visits every slot of a
    power-of-two table (full-period linear congruential step) once ``perturb`` reaches 0, and
    the early steps mix in the high bits of the hash, which spreads clustered hashes apart."""
    perturb = hash_value & _MASK64
    i = perturb & mask
    while True:
        yield i
        perturb >>= _PERTURB_SHIFT
        i = (i * 5 + perturb + 1) & mask


class OpenAddressingTable[K, V]:
    """Mapping from hashable keys to values. Iteration order is slot order, not insertion."""

    def __init__(self) -> None:
        self._slots: list[tuple[int, K, V] | _Tombstone | None] = [None] * _MIN_CAPACITY
        self._live = 0  # real entries
        self._used = 0  # real entries + tombstones: what the load factor must count

    # ---- introspection -------------------------------------------------------------------
    def __len__(self) -> int:
        return self._live

    @property
    def capacity(self) -> int:
        return len(self._slots)

    @property
    def load_factor(self) -> float:
        return self._used / len(self._slots)

    @property
    def tombstones(self) -> int:
        return self._used - self._live

    # ---- core lookup ---------------------------------------------------------------------
    def _find(self, key: K, hash_value: int) -> tuple[int, int, int]:
        """Return ``(found_index or -1, insertion_index, slots_inspected)``."""
        mask = len(self._slots) - 1
        first_free = -1
        inspected = 0
        for i in probe_sequence(hash_value, mask):
            inspected += 1
            slot = self._slots[i]
            if slot is None:
                return -1, (first_free if first_free >= 0 else i), inspected
            if isinstance(slot, _Tombstone):
                if first_free < 0:
                    first_free = i
                continue
            stored_hash, stored_key, _ = slot
            # cheap integer test first, identity second, __eq__ only as the last resort
            if stored_hash == hash_value and (stored_key is key or stored_key == key):
                return i, i, inspected
        raise AssertionError("unreachable: the table always keeps an empty slot")

    def probes(self, key: K) -> int:
        """How many slots a lookup of ``key`` inspects (1 is the ideal case)."""
        return self._find(key, hash(key))[2]

    # ---- mapping API ---------------------------------------------------------------------
    def __getitem__(self, key: K) -> V:
        found, _, _ = self._find(key, hash(key))
        if found < 0:
            raise KeyError(key)
        slot = self._slots[found]
        assert isinstance(slot, tuple)
        return slot[2]

    def get(self, key: K, default: V | None = None) -> V | None:
        found, _, _ = self._find(key, hash(key))
        if found < 0:
            return default
        slot = self._slots[found]
        assert isinstance(slot, tuple)
        return slot[2]

    def __contains__(self, key: object) -> bool:
        try:
            return self._find(key, hash(key))[0] >= 0  # type: ignore[arg-type]
        except TypeError:
            return False  # unhashable keys are never members

    def __setitem__(self, key: K, value: V) -> None:
        hash_value = hash(key)  # may raise TypeError before anything is touched
        found, insert_at, _ = self._find(key, hash_value)
        if found >= 0:
            old = self._slots[found]
            assert isinstance(old, tuple)
            self._slots[found] = (hash_value, old[1], value)
            return
        if self._slots[insert_at] is None:  # consuming a never-used slot raises the load
            if self._used + 1 > len(self._slots) * _MAX_LOAD:
                self._rebuild()
                _, insert_at, _ = self._find(key, hash_value)
            self._used += 1
        self._slots[insert_at] = (hash_value, key, value)
        self._live += 1

    def __delitem__(self, key: K) -> None:
        found, _, _ = self._find(key, hash(key))
        if found < 0:
            raise KeyError(key)
        self._slots[found] = _TOMBSTONE
        self._live -= 1

    def __iter__(self) -> Iterator[K]:
        for slot in self._slots:
            if isinstance(slot, tuple):
                yield slot[1]

    def items(self) -> Iterator[tuple[K, V]]:
        for slot in self._slots:
            if isinstance(slot, tuple):
                yield slot[1], slot[2]

    # ---- resize --------------------------------------------------------------------------
    def _rebuild(self) -> None:
        """Re-insert live entries into a fresh array. Stored hashes are reused, so no
        ``__hash__`` or ``__eq__`` runs here: a rebuild cannot fail half-way."""
        capacity = _MIN_CAPACITY
        while self._live + 1 > capacity * _REBUILD_LOAD:
            capacity *= 2
        old = self._slots
        new_slots: list[tuple[int, K, V] | _Tombstone | None] = [None] * capacity
        mask = capacity - 1
        for slot in old:
            if isinstance(slot, tuple):
                for i in probe_sequence(slot[0], mask):
                    if new_slots[i] is None:
                        new_slots[i] = slot
                        break
        self._slots = new_slots
        self._used = self._live
