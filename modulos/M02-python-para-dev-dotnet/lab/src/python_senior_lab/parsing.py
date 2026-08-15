"""Parsing streaming, UTF-8 explícito e cadeia de exceções preservada."""

from __future__ import annotations

import csv
from collections.abc import Iterator, Mapping
from pathlib import Path
from typing import TextIO

from pydantic import ValidationError

from python_senior_lab.domain import Transaction
from python_senior_lab.models import LaxTransactionInput

CSV_FIELDS = ("id", "amount", "currency", "category", "occurred_at")


class InputContractError(ValueError):
    """Entrada pode ser lida, mas não satisfaz o contrato declarado."""


class InputOperationalError(OSError):
    """Falha operacional ao abrir ou decodificar uma entrada."""


def parse_row(row: Mapping[str, str | None], *, line_number: int) -> Transaction:
    missing = [field for field in CSV_FIELDS if row.get(field) is None]
    if missing:
        raise InputContractError(f"linha {line_number}: campos ausentes: {', '.join(missing)}")
    # DictReader usa a chave None quando uma linha contém mais valores do que o cabeçalho.
    # Trate isso como erro de contrato antes de formatar nomes de campos.
    if None in row:
        raise InputContractError(f"linha {line_number}: colunas excedentes sem cabeçalho")
    extras = sorted(key for key in row if key not in CSV_FIELDS)
    if extras:
        raise InputContractError(f"linha {line_number}: campos extras: {', '.join(extras)}")
    try:
        model = LaxTransactionInput.model_validate(dict(row))
        return model.to_domain()
    except (ValidationError, ValueError) as exc:
        raise InputContractError(f"linha {line_number}: transação inválida") from exc


def iter_stream(stream: TextIO) -> Iterator[Transaction]:
    reader = csv.DictReader(stream)
    if tuple(reader.fieldnames or ()) != CSV_FIELDS:
        raise InputContractError(
            f"cabeçalho inválido: esperado {','.join(CSV_FIELDS)}; "
            f"recebido {','.join(reader.fieldnames or ())}"
        )
    for line_number, row in enumerate(reader, start=2):
        yield parse_row(row, line_number=line_number)


def iter_file(path: Path) -> Iterator[Transaction]:
    """Generator mantém o arquivo aberto apenas durante a iteração."""

    try:
        with path.open("r", encoding="utf-8", newline="") as stream:
            yield from iter_stream(stream)
    except InputContractError, UnicodeDecodeError:
        raise
    except OSError as exc:
        raise InputOperationalError(f"não foi possível ler {path}") from exc


def format_row(transaction: Transaction) -> dict[str, str]:
    return {
        "id": transaction.transaction_id,
        "amount": format(transaction.amount, "f"),
        "currency": transaction.currency,
        "category": transaction.category,
        "occurred_at": transaction.occurred_at.isoformat(),
    }


def write_file(path: Path, transactions: Iterator[Transaction]) -> int:
    """Escreve newline portátil e substitui o destino apenas após sucesso."""

    temporary = path.with_suffix(f"{path.suffix}.tmp")
    count = 0
    try:
        with temporary.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=CSV_FIELDS, lineterminator="\n")
            writer.writeheader()
            for transaction in transactions:
                writer.writerow(format_row(transaction))
                count += 1
        temporary.replace(path)
    except InputContractError, UnicodeError:
        temporary.unlink(missing_ok=True)
        raise
    except OSError as exc:
        try:
            temporary.unlink(missing_ok=True)
        finally:
            raise InputOperationalError(f"não foi possível escrever {path}") from exc
    return count
