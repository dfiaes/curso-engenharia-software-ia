"""Oraculo LT03-AT-001: Dockerfile aprovado e cada defeito isolado.

Numeros: exemplo variavel (parse de texto, sem tempo). Sem Docker, sem rede.
"""

from __future__ import annotations

import validar_dockerfile as vd

DIGEST = "@sha256:" + "a" * 64

APROVADO = f"""FROM python:3.14-slim{DIGEST} AS base
WORKDIR /app
COPY requirements.lock ./
RUN pip install --no-cache-dir -r requirements.lock
COPY app.py ./
RUN useradd --no-create-home appuser
USER appuser
CMD ["python", "app.py"]
"""

ROOT = APROVADO.replace("USER appuser", "USER root")

SEM_USER = (
    "\n".join(linha for linha in APROVADO.splitlines() if not linha.strip().startswith("USER"))
    + "\n"
)

BASE_CHEIA = APROVADO.replace("python:3.14-slim", "python:3.14")

SEM_DIGEST = APROVADO.replace(DIGEST, ":3.14-slim")

COM_SEGREDO_ENV = APROVADO.replace("USER appuser", "ENV API_KEY=segredo-falso\nUSER appuser")

COM_SEGREDO_COPY = APROVADO.replace(
    "COPY app.py ./", "COPY app.py ./\nCOPY secrets.token /app/secrets.token"
)


def test_aprovado_passsa_em_todas_as_condicoes() -> None:
    rel = vd.relatorio(APROVADO)
    assert rel["aprovada"] is True
    assert rel["nao_root"] is True
    assert rel["digest_pinado"] is True
    assert rel["base_minima"] is True
    assert rel["expoe_segredo"] is False
    assert vd.usuario_final(APROVADO) == "appuser"


def test_root_reprova_nao_root() -> None:
    rel = vd.relatorio(ROOT)
    assert rel["aprovada"] is False
    assert rel["nao_root"] is False


def test_sem_user_reprova_como_root_implicito() -> None:
    assert vd.usuario_final(SEM_USER) is None
    rel = vd.relatorio(SEM_USER)
    assert rel["nao_root"] is False
    assert rel["aprovada"] is False


def test_base_cheia_reprova_base_minima() -> None:
    rel = vd.relatorio(BASE_CHEIA)
    assert rel["base_minima"] is False
    assert rel["aprovada"] is False


def test_sem_digest_reprova_digest_pinado() -> None:
    rel = vd.relatorio(SEM_DIGEST)
    assert rel["digest_pinado"] is False
    assert rel["aprovada"] is False


def test_segredo_em_env_reprova() -> None:
    assert vd.expoe_segredo(COM_SEGREDO_ENV) is True
    assert vd.relatorio(COM_SEGREDO_ENV)["aprovada"] is False


def test_segredo_em_copy_reprova() -> None:
    assert vd.expoe_segredo(COM_SEGREDO_COPY) is True
    assert vd.relatorio(COM_SEGREDO_COPY)["aprovada"] is False


def test_bases_e_instrucoes_lidas_como_dados() -> None:
    bases = vd.bases(APROVADO)
    assert len(bases) == 1
    assert bases[0].endswith(DIGEST)
    insts = vd.instrucoes("# comentario\n\nFROM x\n")
    assert insts == [("FROM", "x")]
