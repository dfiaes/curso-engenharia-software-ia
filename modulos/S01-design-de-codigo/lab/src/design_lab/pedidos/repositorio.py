"""Persistence port (a Protocol owned by the consumer), a fake and a SQLite adapter."""

import json
import sqlite3
from dataclasses import dataclass
from datetime import date
from typing import Protocol

from design_lab.pedidos.modelos import Resultado


class PedidoJaExiste(Exception):
    def __init__(self, pedido_id: str) -> None:
        super().__init__(f"pedido já existe: {pedido_id}")
        self.pedido_id = pedido_id


@dataclass(frozen=True, slots=True)
class PedidoCalculado:
    pedido_id: str
    resultado: Resultado
    calculado_em: date


class RepositorioPedidos(Protocol):
    def salvar(self, registro: PedidoCalculado) -> None: ...

    def obter(self, pedido_id: str) -> PedidoCalculado | None: ...

    def listar_do_dia(self, dia: date) -> list[PedidoCalculado]: ...


class RepositorioEmMemoria:
    """Fake: a real implementation of the contract, just not durable."""

    def __init__(self) -> None:
        self._dados: dict[str, PedidoCalculado] = {}

    def salvar(self, registro: PedidoCalculado) -> None:
        if registro.pedido_id in self._dados:
            raise PedidoJaExiste(registro.pedido_id)
        self._dados[registro.pedido_id] = registro

    def obter(self, pedido_id: str) -> PedidoCalculado | None:
        return self._dados.get(pedido_id)

    def listar_do_dia(self, dia: date) -> list[PedidoCalculado]:
        achados = [r for r in self._dados.values() if r.calculado_em == dia]
        return sorted(achados, key=lambda r: r.pedido_id)


class RepositorioSqlite:
    """Adapter over the standard library; ``:memory:`` is enough for the lab."""

    def __init__(self, caminho: str = ":memory:") -> None:
        self._con = sqlite3.connect(caminho)
        self._con.execute(
            "CREATE TABLE IF NOT EXISTS pedidos ("
            "id TEXT PRIMARY KEY, subtotal INTEGER NOT NULL, desconto INTEGER NOT NULL, "
            "frete INTEGER NOT NULL, total INTEGER NOT NULL, avisos TEXT NOT NULL, "
            "calculado_em TEXT NOT NULL)"
        )

    def salvar(self, registro: PedidoCalculado) -> None:
        r = registro.resultado
        try:
            with self._con:
                self._con.execute(
                    "INSERT INTO pedidos VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (
                        registro.pedido_id,
                        r.subtotal,
                        r.desconto,
                        r.frete,
                        r.total,
                        json.dumps(list(r.avisos), ensure_ascii=False),
                        registro.calculado_em.isoformat(),
                    ),
                )
        except sqlite3.IntegrityError:
            raise PedidoJaExiste(registro.pedido_id) from None

    def obter(self, pedido_id: str) -> PedidoCalculado | None:
        linha = self._con.execute("SELECT * FROM pedidos WHERE id = ?", (pedido_id,)).fetchone()
        return None if linha is None else _registro(linha)

    def listar_do_dia(self, dia: date) -> list[PedidoCalculado]:
        linhas = self._con.execute(
            "SELECT * FROM pedidos WHERE calculado_em = ? ORDER BY id", (dia.isoformat(),)
        ).fetchall()
        return [_registro(linha) for linha in linhas]

    def fechar(self) -> None:
        self._con.close()


def _registro(linha: tuple[str, int, int, int, int, str, str]) -> PedidoCalculado:
    pedido_id, subtotal, desconto, frete, total, avisos, dia = linha
    resultado = Resultado(subtotal, desconto, frete, total, tuple(json.loads(avisos)))
    return PedidoCalculado(pedido_id, resultado, date.fromisoformat(dia))
