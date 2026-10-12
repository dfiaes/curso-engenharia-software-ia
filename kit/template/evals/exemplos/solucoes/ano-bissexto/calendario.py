def bissexto(ano):
    """Regra gregoriana: divisível por 4, exceto séculos, salvo os divisíveis por 400."""
    return ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0)
