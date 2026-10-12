def mesclar(intervalos):
    """Mescla intervalos [ini, fim] que se sobrepõem ou se tocam. Devolve lista ordenada de tuplas.

    A entrada pode estar desordenada e NÃO deve ser modificada.
    """
    saida = []
    for ini, fim in sorted(map(tuple, intervalos)):
        if saida and ini <= saida[-1][1]:
            saida[-1] = (saida[-1][0], max(saida[-1][1], fim))
        else:
            saida.append((ini, fim))
    return saida
