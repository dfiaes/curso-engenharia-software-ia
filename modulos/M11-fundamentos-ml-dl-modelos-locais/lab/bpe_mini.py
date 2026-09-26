"""BPE mínimo em Python puro sobre corpus-toy local.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L.
Oráculo offline de AT-012: sem tiktoken, sem HF, sem rede.
"""

from collections import Counter
from itertools import pairwise

CORPUS_TOY: list[str] = (
    ["1234"] * 20
    + ["12"] * 10
    + ["34"] * 9
    + ["123"] * 8
    + ["5"] * 5
    + ["baixo"] * 5
    + ["baixa"] * 5
)
N_FUSOES: int = 8


def treinar_bpe(corpus: list[str] = CORPUS_TOY, n_fusoes: int = N_FUSOES) -> list[tuple[str, str]]:
    palavras: list[list[str]] = [[c for c in w] for w in corpus]
    fusoes: list[tuple[str, str]] = []
    for _ in range(n_fusoes):
        cont: Counter[tuple[str, str]] = Counter()
        for p in palavras:
            for a, b in pairwise(p):
                cont[(a, b)] += 1
        if not cont:
            break
        melhor = sorted(cont.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
        fusoes.append(melhor)
        a, b = melhor
        novo = a + b
        for p in palavras:
            i = 0
            ref: list[str] = []
            while i < len(p):
                if i < len(p) - 1 and p[i] == a and p[i + 1] == b:
                    ref.append(novo)
                    i += 2
                else:
                    ref.append(p[i])
                    i += 1
            p[:] = ref
    return fusoes


def segmentar(texto: str, fusoes: list[tuple[str, str]]) -> list[str]:
    toks: list[str] = [c for c in texto]
    for a, b in fusoes:
        novo = a + b
        i = 0
        ref: list[str] = []
        while i < len(toks):
            if i < len(toks) - 1 and toks[i] == a and toks[i + 1] == b:
                ref.append(novo)
                i += 2
            else:
                ref.append(toks[i])
                i += 1
        toks = ref
    return toks


def provar_numeros_vizinhos() -> tuple[list[str], list[str]]:
    fusoes = treinar_bpe()
    return segmentar("1234", fusoes), segmentar("1235", fusoes)


def main() -> None:
    a, b = provar_numeros_vizinhos()
    print(f"1234 -> {a}")
    print(f"1235 -> {b}")


if __name__ == "__main__":
    main()
