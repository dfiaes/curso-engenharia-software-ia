"""Descritores e vazamento: abrir rastreado, fechar, voltar ao baseline.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (os).
Sem rede; opera em arquivos possuídos pelo laboratorio.
"""

from __future__ import annotations

import os


class RastreadorFD:
    """Conta descritores abertos por este modulo e ainda nao fechados."""

    def __init__(self) -> None:
        self._abertos: set[int] = set()

    def abrir(self, caminho: str) -> int:
        """Abre para leitura e registra o descritor."""
        fd = os.open(caminho, os.O_RDONLY)
        self._abertos.add(fd)
        return fd

    def fechar(self, fd: int) -> None:
        """Fecha e baixa do registro; fechar fora do registro e erro."""
        if fd not in self._abertos:
            raise ValueError("descritor fora do registro: feche por quem abriu")
        os.close(fd)
        self._abertos.discard(fd)

    def em_aberto(self) -> int:
        """Quantos descritores deste rastreador seguem sem fechar."""
        return len(self._abertos)


def listar_fd_visiveis() -> list[str]:
    """Nomes visiveis em /proc/self/fd; lista vazia onde nao ha proc."""
    try:
        entradas = os.listdir("/proc/self/fd")
    except OSError:
        return []
    return sorted(entradas)


def servir_sem_fechar(rastreador: RastreadorFD, caminho: str, vezes: int) -> int:
    """Lado da falha: abre N vezes sem fechar; publica o acumulado."""
    for _ in range(vezes):
        rastreador.abrir(caminho)
    return rastreador.em_aberto()


def servir_fechando(rastreador: RastreadorFD, caminho: str, vezes: int) -> int:
    """Lado da correcao: cada abertura e fechada; publica o restante."""
    for _ in range(vezes):
        fd = rastreador.abrir(caminho)
        rastreador.fechar(fd)
    return rastreador.em_aberto()
