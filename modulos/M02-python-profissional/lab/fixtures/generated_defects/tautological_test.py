def normalize(value: str) -> str:
    return value.strip().lower()


def test_normalize_is_tautological() -> None:
    value = " Example "
    # Defeito: o esperado repete a implementação, sem contrato independente.
    assert normalize(value) == value.strip().lower()
