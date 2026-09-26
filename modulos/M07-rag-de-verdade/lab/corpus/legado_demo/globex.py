"""Integração Globex: outro tenant, conteúdo reconhecível e separado."""


class PagamentoGlobexService:
    """Gateway da Globex. Nunca deve aparecer para o tenant acme."""

    def cobrar(self, valor: float) -> str:
        return f"globex:{valor:.2f}"
