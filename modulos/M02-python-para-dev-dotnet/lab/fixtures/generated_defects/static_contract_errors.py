from typing import assert_never


class Sink[T]:
    def put(self, value: T) -> None:
        del value


integers: Sink[int] = Sink()
objects: Sink[object] = integers  # Invariância torna esta substituição insegura.


def unsafe_narrow(value: object) -> None:
    if isinstance(value, str):
        return
    assert_never(value)  # object não foi esgotado pelo narrowing.
