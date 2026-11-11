"""Marca a página em texto <COD>.html para o alternador Interativo/Texto.

Idempotente: rodar de novo não duplica nada. Faz duas coisas:
- remove a caixa antiga "Versão interativa:" (o interativo é o padrão agora);
- põe data-interativo="<COD>-interativo.html" em <html>, lido por assets/course.js.
Nunca escreve dentro de <script>. Uso: python3 tools/interativo/marcar_modo.py [modulos/*/]
"""
import pathlib, re, sys

BOX = re.compile(r'\n?<div class="box ok"><strong>Versão interativa:</strong>[^\n]*?</div>')
HTML_TAG = re.compile(r'<html\b([^>]*)>')


def marcar(texto_path: pathlib.Path, cod: str) -> bool:
    """Devolve True se alterou o arquivo."""
    fonte = texto_path.read_text(encoding="utf-8")
    novo = BOX.sub("", fonte, count=1)
    alvo = f"{cod}-interativo.html"
    if f'data-interativo="{alvo}"' not in novo:
        novo = HTML_TAG.sub(lambda m: f'<html{m.group(1)} data-interativo="{alvo}">', novo, count=1)
    if novo != fonte:
        texto_path.write_text(novo, encoding="utf-8")
        return True
    return False


def main() -> int:
    raiz = pathlib.Path(__file__).resolve().parents[2] / "modulos"
    mudados = 0
    for interativo in sorted(raiz.glob("*/*-interativo.html")):
        cod = interativo.name[: -len("-interativo.html")]
        texto = interativo.with_name(f"{cod}.html")
        if texto.is_file() and marcar(texto, cod):
            mudados += 1
            print("marcado", texto.relative_to(raiz.parent))
    print(f"{mudados} página(s) alterada(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
