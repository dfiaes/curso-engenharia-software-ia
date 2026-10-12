def sem_duplicados(itens):
    """Remove duplicados preservando a ordem da primeira ocorrência."""
    return list(dict.fromkeys(itens))
