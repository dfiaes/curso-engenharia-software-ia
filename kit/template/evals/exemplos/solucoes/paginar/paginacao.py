def paginar(itens, pagina, tamanho):
    """Devolve os itens da página (começa em 1). Página fora do intervalo devolve lista vazia.

    tamanho <= 0 ou pagina < 1 levanta ValueError.
    """
    if tamanho <= 0 or pagina < 1:
        raise ValueError("pagina >= 1 e tamanho > 0")
    ini = (pagina - 1) * tamanho
    return list(itens[ini:ini + tamanho])
