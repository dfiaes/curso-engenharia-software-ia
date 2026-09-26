"""Zombies e coleta: o filho morto aguarda o wait do pai.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (os).
POSIX EXCLUSIVO: usa os.fork e os.waitpid, ausentes no Windows.
Em plataforma sem fork, o modulo registra indisponibilidade em vez de simular.
"""

from __future__ import annotations

import os

if not hasattr(os, "fork"):
    raise RuntimeError("coleta_zumbis exige POSIX (os.fork ausente nesta plataforma)")


def filho_que_termina(codigo: int) -> int:
    """No filho: termina com o codigo contratado. So retorna no pai."""
    pid = os.fork()
    if pid == 0:
        os._exit(codigo)
    return pid


def coletar(pid: int) -> int:
    """No pai: recolhe o exit code; so entao o zombie deixa de existir."""
    _, estado = os.waitpid(pid, 0)
    return os.waitstatus_to_exitcode(estado)


def demonstra() -> dict[str, int]:
    """Cria, aguarda a coleta e publica o codigo recolhido."""
    pid = filho_que_termina(3)
    codigo = coletar(pid)
    return {"pid_filho": pid, "exit_code_coletado": codigo}
