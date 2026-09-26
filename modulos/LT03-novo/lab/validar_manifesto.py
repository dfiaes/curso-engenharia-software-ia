"""Validacao estatica de manifestos declarativos: probes, recursos, segredo.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (re).
Manifestos entram como dicts Python puros; sem PyYAML, sem rede, sem cluster.
"""

from __future__ import annotations

import re

PADRAO_SECRETO = re.compile(r"(senha|secret|token|password|passwd|pwd|api[_-]?key)", re.IGNORECASE)


def conteineres(manifesto: dict[str, object]) -> list[dict[str, object]]:
    """Extrai a lista de containers do manifesto, ou lista vazia."""
    especificacao = manifesto.get("especificacao")
    if not isinstance(especificacao, dict):
        return []
    lista = especificacao.get("conteineres")
    if not isinstance(lista, list):
        return []
    return [item for item in lista if isinstance(item, dict)]


def probes_presentes(container: dict[str, object]) -> dict[str, bool]:
    """True por probe presente: inicializacao, prontidao, vivacidade."""
    sondas = container.get("sondas")
    nomes: set[str] = set()
    if isinstance(sondas, dict):
        for chave in sondas:
            nomes.add(str(chave))
    return {
        "inicializacao": "inicializacao" in nomes,
        "prontidao": "prontidao" in nomes,
        "vivacidade": "vivacidade" in nomes,
    }


def recursos_declarados(container: dict[str, object]) -> bool:
    """True quando pedido e teto existem para CPU e memoria."""
    recursos = container.get("recursos")
    if not isinstance(recursos, dict):
        return False
    pedido = recursos.get("pedido")
    teto = recursos.get("teto")
    if not isinstance(pedido, dict) or not isinstance(teto, dict):
        return False
    tem_pedido = pedido.get("cpu") and pedido.get("memoria")
    tem_teto = teto.get("cpu") and teto.get("memoria")
    return bool(tem_pedido and tem_teto)


def expoe_segredo_em_env(container: dict[str, object]) -> bool:
    """True se alguma variavel de ambiente carrega nome ou valor de segredo."""
    ambiente = container.get("env")
    if not isinstance(ambiente, list):
        return False
    for entrada in ambiente:
        if not isinstance(entrada, dict):
            continue
        nome = str(entrada.get("nome", ""))
        valor = str(entrada.get("valor", ""))
        if PADRAO_SECRETO.search(nome) or PADRAO_SECRETO.search(valor):
            return True
        if "segredo_literal" in entrada:
            return True
    return False


def seletor_encontra_labels(seletor: dict[str, str], labels: dict[str, str]) -> bool:
    """True quando todo par do seletor existe identico nas labels."""
    for chave, valor in seletor.items():
        if labels.get(chave) != valor:
            return False
    return bool(seletor)


def relatorio(manifestos: list[dict[str, object]]) -> dict[str, object]:
    """Junta as verificacoes; 'aprovado' exige todas as condicoes."""
    violacoes: list[str] = []
    for manifesto in manifestos:
        nome = str(manifesto.get("nome", "sem-nome"))
        for container in conteineres(manifesto):
            sondas = probes_presentes(container)
            if not (sondas["prontidao"] and sondas["vivacidade"]):
                violacoes.append(nome + ": probe obrigatoria ausente")
            if not recursos_declarados(container):
                violacoes.append(nome + ": recursos nao declarados")
            if expoe_segredo_em_env(container):
                violacoes.append(nome + ": segredo em env")
    veredito: dict[str, object] = {"violacoes": violacoes}
    veredito["aprovado"] = not violacoes
    return veredito
