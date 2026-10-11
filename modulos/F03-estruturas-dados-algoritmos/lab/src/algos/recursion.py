"""Recursion, the call stack and divide and conquer."""

import contextlib
import sys


def sum_to_recursive(n: int) -> int:
    """1 + 2 + ... + n, one stack frame per step."""
    return 0 if n <= 0 else n + sum_to_recursive(n - 1)


def sum_to_iterative(n: int) -> int:
    total = 0
    for i in range(1, n + 1):
        total += i
    return total


def reachable_depth() -> int:
    """How deep a trivial recursive function gets before ``RecursionError`` in this process."""
    depth = 0

    def dive() -> None:
        nonlocal depth
        depth += 1
        dive()

    with contextlib.suppress(RecursionError):
        dive()
    return depth


def fast_power(base: int, exponent: int, modulus: int | None = None) -> int:
    """``base ** exponent`` by repeated squaring: T(n) = T(n/2) + O(1), so O(log n) multiplies.
    Written iteratively over the bits of the exponent."""
    if exponent < 0:
        raise ValueError("exponent must be non-negative")
    result = 1
    b = base
    e = exponent
    while e:
        if e & 1:
            result = result * b if modulus is None else (result * b) % modulus
        b = b * b if modulus is None else (b * b) % modulus
        e >>= 1
    return result if modulus is None else result % modulus


def recursion_limit() -> int:
    return sys.getrecursionlimit()
