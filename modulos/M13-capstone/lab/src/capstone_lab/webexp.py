"""Experiência web mínima: página estática determinística e onboarding (M13 B15).

Invariantes:
- Render é **função pura** estado→HTML: mesma entrada, mesmos bytes; sem
  framework, sem JS obrigatório, todo conteúdo vindo de fora passa por escape.
- Estados explícitos: empty, progress, error e result — nenhum deles silencioso.
- Acessibilidade é auditável por oráculo estrutural (``a11y_audit``): lang,
  h1 único, labels, alt e status ARIA são testados, não declarados.
- Onboarding é a mesma jornada do CLI: cadastro → ingestão → primeira pergunta
  → relatório, como lista tipada de passos determinísticos.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass

STATES = ("empty", "progress", "error", "result")
ONBOARDING_STEPS: tuple[str, ...] = (
    "cadastro: criar tenant e usuário local",
    "ingestão: apontar repositório e aguardar job concluir",
    "primeira pergunta: busca com citação e abstenção possível",
    "relatório: abrir resultado com empty/error/result visíveis",
)


@dataclass(frozen=True)
class Page:
    state: str
    title: str
    message: str = ""
    items: tuple[str, ...] = ()


def render_page(page: Page) -> str:
    """Renderiza HTML estático; saída determinística, conteúdo escapado."""
    if page.state not in STATES:
        raise ValueError(f"estado desconhecido: {page.state}")
    title, msg = html.escape(page.title), html.escape(page.message)
    body = [f"<h1>{title}</h1>"]
    if page.state == "empty":
        body.append('<p role="status">Nenhum resultado ainda. Ingira um repositório.</p>')
    elif page.state == "progress":
        body.append(f'<p role="status" aria-live="polite">Processando… {msg}</p>')
    elif page.state == "error":
        body.append(f'<p role="alert">{msg}</p>')
    else:
        items = "".join(f"<li>{html.escape(i)}</li>" for i in page.items)
        body.append(f"<ul>{items}</ul>")
    return (
        '<!DOCTYPE html>\n<html lang="pt-BR">\n<head><meta charset="utf-8">'
        f"<title>{title}</title></head>\n<body>\n" + "\n".join(body) + "\n</body>\n</html>\n"
    )


def a11y_audit(document: str) -> list[str]:
    """Oráculo estrutural WCAG 2.2 AA (subconjunto verificável sem navegador)."""
    violations: list[str] = []
    if 'lang="' not in document:
        violations.append("html sem atributo lang")
    if document.count("<h1") != 1:
        violations.append("exatamente um h1 por página")
    for img in re.findall(r"<img[^>]*>", document):
        if "alt=" not in img:
            violations.append(f"img sem alt: {img}")
    for input_el in re.findall(r"<input[^>]*>", document):
        if "aria-label" not in input_el and "id=" not in input_el:
            violations.append(f"input sem label: {input_el}")
    if "Processando" in document and "aria-live" not in document:
        violations.append("estado de progresso sem aria-live")
    return violations


def onboarding_checklist() -> list[str]:
    """Passos da primeira jornada, na ordem; determinístico por construção."""
    return list(ONBOARDING_STEPS)


def cli_onboarding() -> str:
    """Roteiro CLI textual da jornada (saída estável, diff-friendly)."""
    lines = ["Jornada inicial do Cartógrafo:"]
    lines += [f"{i}. {step}" for i, step in enumerate(ONBOARDING_STEPS, start=1)]
    return "\n".join(lines) + "\n"
