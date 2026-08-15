from decimal import Decimal

import pytest

from python_senior_lab.ports import FixedRateProvider, MappingRateProvider, RateProvider, convert


@pytest.mark.parametrize(
    "provider",
    [
        FixedRateProvider(Decimal("5")),
        MappingRateProvider({("USD", "BRL"): Decimal("5")}),
    ],
)
def test_two_structural_adapters_share_the_same_contract(provider: RateProvider) -> None:
    assert convert(Decimal("2"), "USD", "BRL", provider) == Decimal("10")


def test_mapping_adapter_preserves_exception_cause() -> None:
    provider = MappingRateProvider({})

    with pytest.raises(LookupError) as captured:
        provider.rate("USD", "BRL")

    assert isinstance(captured.value.__cause__, KeyError)
