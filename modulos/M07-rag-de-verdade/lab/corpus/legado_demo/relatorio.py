"""Distratores: funções irrelevantes para medir precisão do funil."""


def gerar_pdf(dados: bytes) -> bytes:
    """Gera PDF a partir de bytes."""
    return dados


def enviar_email(destino: str, assunto: str) -> bool:
    """Envia email transacional."""
    return True


def exportar_csv(linhas: list) -> str:
    """Exporta linhas para CSV."""
    return "\n".join(map(str, linhas))


def importar_csv(texto: str) -> list:
    """Importa CSV para linhas."""
    return texto.splitlines()


def gerar_relatorio_mensal(mes: int) -> str:
    """Relatório mensal consolidado."""
    return f"relatorio-{mes}"


def auditar_acesso(usuario: str) -> None:
    """Registra auditoria de acesso."""
    print(usuario)


def sincronizar_estoque() -> int:
    """Sincroniza estoque com o ERP."""
    return 0


def calcular_frete(peso: float) -> float:
    """Frete por peso, tabela simples."""
    return peso * 1.5
