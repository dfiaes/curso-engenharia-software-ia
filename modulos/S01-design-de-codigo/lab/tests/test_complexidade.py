from design_lab.complexidade import medir_fonte


def medida(fonte: str, nome: str) -> tuple[int, int]:
    m = next(m for m in medir_fonte(fonte) if m.nome == nome)
    return m.ciclomatica, m.aninhamento


def test_funcao_sem_decisao_vale_1() -> None:
    assert medida("def f(x):\n    return x\n", "f") == (1, 0)


def test_if_elif_else_conta_cada_ramo_e_elif_nao_aninha() -> None:
    fonte = (
        "def f(x):\n"
        "    if x == 1:\n        return 1\n"
        "    elif x == 2:\n        return 2\n"
        "    else:\n        return 3\n"
    )
    assert medida(fonte, "f") == (3, 1)


def test_operadores_booleanos_e_comprehension_contam() -> None:
    assert medida("def f(a, b, c):\n    return a and b or c\n", "f")[0] == 3
    assert medida("def f(xs):\n    return [x for x in xs if x]\n", "f")[0] == 3


def test_aninhamento_cresce_com_blocos() -> None:
    fonte = (
        "def f(xs):\n"
        "    for x in xs:\n"
        "        if x:\n"
        "            while x:\n"
        "                x -= 1\n"
    )
    assert medida(fonte, "f") == (4, 3)


def test_funcao_aninhada_e_medida_separadamente() -> None:
    fonte = (
        "def f(x):\n"
        "    def g(y):\n"
        "        if y:\n            return 1\n"
        "        return 0\n"
        "    return g(x)\n"
    )
    assert medida(fonte, "g")[0] == 2
