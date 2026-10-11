"""Aritmética de custo. Todo preço entra como parâmetro: os números são sempre exemplo."""

import argparse
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TokenPrice:
    """Preço em moeda por 1 milhão de tokens."""

    input_per_million: float
    output_per_million: float


@dataclass(frozen=True, slots=True)
class ComputePrice:
    """Preço por segundo de vCPU e de GiB de memória, em estado ativo e ocioso."""

    active_vcpu_s: float
    active_gib_s: float
    idle_vcpu_s: float
    idle_gib_s: float


def call_cost(input_tokens: int, output_tokens: int, price: TokenPrice) -> float:
    return (
        input_tokens * price.input_per_million + output_tokens * price.output_per_million
    ) / 1_000_000


def monthly_llm_cost(
    requests_per_day: int, avg_input: int, avg_output: int, price: TokenPrice, days: int = 30
) -> float:
    if min(requests_per_day, avg_input, avg_output, days) < 0:
        raise ValueError("quantidades não podem ser negativas")
    return call_cost(avg_input, avg_output, price) * requests_per_day * days


def replica_cost(
    vcpu: float, gib: float, active_s: float, idle_s: float, price: ComputePrice
) -> float:
    """Custo bruto de uma réplica, antes de qualquer cota gratuita."""
    if min(vcpu, gib, active_s, idle_s) < 0:
        raise ValueError("quantidades não podem ser negativas")
    active = active_s * (vcpu * price.active_vcpu_s + gib * price.active_gib_s)
    idle = idle_s * (vcpu * price.idle_vcpu_s + gib * price.idle_gib_s)
    return active + idle


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Estimativa de custo de tokens (preços de exemplo)"
    )
    parser.add_argument("--requests-per-day", type=int, required=True)
    parser.add_argument("--input-tokens", type=int, required=True)
    parser.add_argument("--output-tokens", type=int, required=True)
    parser.add_argument("--price-in", type=float, required=True, help="por 1M de tokens")
    parser.add_argument("--price-out", type=float, required=True, help="por 1M de tokens")
    args = parser.parse_args()
    price = TokenPrice(args.price_in, args.price_out)
    per_call = call_cost(args.input_tokens, args.output_tokens, price)
    month = monthly_llm_cost(args.requests_per_day, args.input_tokens, args.output_tokens, price)
    print(f"por chamada: {per_call:.6f}")
    print(f"por mês (30 dias): {month:.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
