def media(valores):
    """Média aritmética. Lista vazia devolve 0.0."""
    if not valores:
        return 0.0
    return sum(valores) / len(valores)
