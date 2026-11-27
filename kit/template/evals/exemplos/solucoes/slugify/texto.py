import re
import unicodedata


def slugify(titulo):
    """Converte um título em slug: minúsculas, sem acentos, palavras separadas por '-'."""
    sem_acento = unicodedata.normalize("NFKD", titulo).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", sem_acento.lower()).strip("-")
