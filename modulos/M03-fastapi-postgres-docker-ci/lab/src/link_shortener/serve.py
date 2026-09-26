"""Ponto de entrada do container (lotes B05/B08).

Monta o app a partir de ``APP_DATABASE_URL``. É raiz de composição (como
``composition.py``): conhece a fiação e está fora do guardrail de
camadas. Saúde (`/health`, com checagem de banco) e correlation id moram
no app; aqui só a construção a partir do ambiente.
"""

from __future__ import annotations

import os

from link_shortener.api.app import create_app
from link_shortener.db import create_engine, session_factory


def _database_url() -> str:
    url = os.environ.get("APP_DATABASE_URL", "")
    if not url:
        raise RuntimeError("APP_DATABASE_URL não definida (veja .env.example)")
    return url


_engine = create_engine(_database_url())
app = create_app(session_factory(_engine))
