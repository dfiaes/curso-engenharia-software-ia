"""Oraculo LT01-AT-060: hipotese antes da leitura, mitigacao sem esconder.

Registro com tres hipoteses (recurso local, dependencia externa,
mudanca recente): cada evidencia referencia a hipotese que a
autorizou, veredito em vocabulario fechado, incident.md em secoes
fixas. Runbook exercitado contra o alvo local por modo declarado:
mitigar contem (efeito impacto_contido_causa_aberta) sem apagar o
sinal; veredito mitigado so com todos os passos conformes. Fechamento
por cadeia completa: regressao falha no degradado e passa no
corrigido (controle negativo). Numeros: exemplo variavel (alvo local
saudavel p95 80.0 ms/erro 0.001; latencia_alta 900.0/0.01; erros_altos
120.0/0.25; amostra seedada 20260601 com N = 50 observacoes). So
stdlib; sem rede, sem container.
"""

from __future__ import annotations

import random

import pytest

import exercicio_runbook as er
import registro_incidente as ri

SEMENTE = 20260601
AMOSTRA = 50


def _abrir() -> ri.Incidente:
    return ri.criar_incidente(
        "INC-060",
        "p95 alto no checkout, alcance 30% dos pedidos",
        "p95 80.0 ms, taxa_erro 0.001 em repouso",
    )


def _tres_hipoteses(incidente: ri.Incidente) -> None:
    ri.registrar_hipotese(
        incidente, "H1", "recurso local saturado", "p95 alto com CPU/FD locais altos"
    )
    ri.registrar_hipotese(
        incidente, "H2", "upstream lento", "p95 alto com local saudavel e espera externa"
    )
    ri.registrar_hipotese(incidente, "H3", "mudanca recente", "sintoma casa com o deploy novo")


def _regressao_saudavel(observado: dict[str, float]) -> bool:
    return observado["p95_ms"] < 200.0 and observado["taxa_erro"] < 0.05


def test_abertura_exige_identificador_impacto_baseline() -> None:
    with pytest.raises(ValueError):
        ri.criar_incidente("  ", "impacto", "baseline")
    with pytest.raises(ValueError):
        ri.criar_incidente("INC", "   ", "baseline")
    with pytest.raises(ValueError):
        ri.criar_incidente("INC", "impacto", "   ")


def test_hipotese_antes_da_leitura_e_dup_vedada() -> None:
    incidente = _abrir()
    hipotese = ri.registrar_hipotese(incidente, "H1", "recurso local", "sinal X")
    assert incidente.hipoteses["H1"] is hipotese
    with pytest.raises(ValueError):
        ri.registrar_hipotese(incidente, "H1", "outro enunciado", "outro sinal")
    with pytest.raises(ValueError):
        ri.registrar_hipotese(incidente, "  ", "enunciado", "sinal")
    with pytest.raises(ValueError):
        ri.registrar_hipotese(incidente, "H9", "   ", "sinal")
    with pytest.raises(ValueError):
        ri.registrar_hipotese(incidente, "H9", "enunciado", "   ")


def test_evidencia_sem_hipotese_previa_recusada() -> None:
    incidente = _abrir()
    with pytest.raises(ValueError, match="sem hipotese previa"):
        ri.registrar_evidencia(incidente, "H-orfa", "leitura sem autorizacao", "refuta")


def test_veredito_fora_do_vocabulario_e_observacao_vazia_recusados() -> None:
    incidente = _abrir()
    ri.registrar_hipotese(incidente, "H1", "recurso local", "sinal X")
    with pytest.raises(ValueError):
        ri.registrar_evidencia(incidente, "H1", "alguma leitura", "provavel")
    with pytest.raises(ValueError):
        ri.registrar_evidencia(incidente, "H1", "   ", "confirma")
    assert ri.VEREDITOS == ("confirma", "refuta", "inconclusiva")


def test_incident_md_em_secoes_fixas_e_encadeadas() -> None:
    incidente = _abrir()
    _tres_hipoteses(incidente)
    ri.registrar_evidencia(incidente, "H1", "CPU/FD locais em repouso sob sintoma", "refuta")
    ri.registrar_evidencia(
        incidente, "H2", "local 0.02 s + upstream 0.8 s no breakdown", "confirma"
    )
    ri.registrar_evidencia(
        incidente, "H3", "deploy novo sem correlacao com o inicio", "inconclusiva"
    )
    texto = ri.gerar_incident_md(incidente)
    assert texto.startswith("# Incidente INC-060\n")
    assert "Impacto: p95 alto no checkout" in texto
    assert "Baseline: p95 80.0 ms" in texto
    assert "\n## Hipoteses\n" in texto
    assert "\n## Evidencias\n" in texto
    assert texto.index("## Hipoteses") < texto.index("## Evidencias")
    for marcador in ("- H1: refuta", "- H2: confirma", "- H3: inconclusiva"):
        assert marcador in texto
    assert texto.endswith("\n")


def test_alvo_modos_publicam_sinal_declarado() -> None:
    assert er.AlvoLocal("saudavel").observar() == {"p95_ms": 80.0, "taxa_erro": 0.001}
    assert er.AlvoLocal("latencia_alta").observar() == {"p95_ms": 900.0, "taxa_erro": 0.01}
    assert er.AlvoLocal("erros_altos").observar() == {"p95_ms": 120.0, "taxa_erro": 0.25}
    assert er.MODOS == ("saudavel", "latencia_alta", "erros_altos")
    assert er.ACOES == ("conter_entrada", "reverter_mudanca", "isolar_upstream")


def test_alvo_modo_invalido_vedado() -> None:
    with pytest.raises(ValueError):
        er.AlvoLocal("pane_secreta")


def test_mitigacao_contem_sem_apagar_o_sinal() -> None:
    alvo = er.AlvoLocal("latencia_alta")
    antes = alvo.observar()
    resultado = alvo.aplicar_mitigacao("conter_entrada")
    assert resultado == {"acao": "conter_entrada", "efeito": "impacto_contido_causa_aberta"}
    assert alvo.mitigado is True
    assert alvo.observar() == antes
    assert alvo.observar()["p95_ms"] == 900.0


def test_mitigacao_acao_invalida_vedada() -> None:
    alvo = er.AlvoLocal("saudavel")
    with pytest.raises(ValueError):
        alvo.aplicar_mitigacao("reiniciar_tudo")
    assert alvo.mitigado is False


def test_passo_exige_nome_e_sinal_e_publica_conformidade() -> None:
    alvo = er.AlvoLocal("saudavel")
    with pytest.raises(ValueError):
        er.executar_passo(alvo, er.Passo("  ", "sinal"), _regressao_saudavel)
    with pytest.raises(ValueError):
        er.executar_passo(alvo, er.Passo("nome", "   "), _regressao_saudavel)
    ok = er.executar_passo(alvo, er.Passo("p95-saudavel", "p95 < 200"), _regressao_saudavel)
    assert ok.conforme is True
    assert ok.observado == {"p95_ms": 80.0, "taxa_erro": 0.001}
    degradado = er.AlvoLocal("latencia_alta")
    falha = er.executar_passo(degradado, er.Passo("p95-saudavel", "p95 < 200"), _regressao_saudavel)
    assert falha.conforme is False
    assert falha.observado["p95_ms"] == 900.0


def test_veredito_runbook_exige_todos_conformes() -> None:
    alvo = er.AlvoLocal("saudavel")
    passos = [
        er.Passo("p95", "p95 < 200"),
        er.Passo("erros", "taxa_erro < 0.05"),
    ]
    resultados = [er.executar_passo(alvo, passo, _regressao_saudavel) for passo in passos]
    assert er.veredito_runbook(resultados) == "mitigado"
    mistos = [er.ResultadoPasso("a", True, {}), er.ResultadoPasso("b", False, {})]
    assert er.veredito_runbook(mistos) == "nao_mitigado"
    with pytest.raises(ValueError):
        er.veredito_runbook([])


def test_cadeia_hipotese_evidencia_correcao_regressao() -> None:
    incidente = _abrir()
    _tres_hipoteses(incidente)
    degradado = er.AlvoLocal("latencia_alta")
    regressao_no_degradado = er.executar_passo(
        degradado, er.Passo("regressao-p95", "p95 < 200"), _regressao_saudavel
    )
    assert regressao_no_degradado.conforme is False
    ri.registrar_evidencia(incidente, "H1", "FD/CPU locais normais sob p95 900.0 ms", "refuta")
    ri.registrar_evidencia(
        incidente, "H2", "p95 900.0 ms com taxa_erro 0.01: espera externa", "confirma"
    )
    mitigado = degradado.aplicar_mitigacao("isolar_upstream")
    assert mitigado["efeito"] == "impacto_contido_causa_aberta"
    corrigido = er.AlvoLocal("saudavel")
    regressao_no_corrigido = er.executar_passo(
        corrigido, er.Passo("regressao-p95", "p95 < 200"), _regressao_saudavel
    )
    assert regressao_no_corrigido.conforme is True
    ri.registrar_evidencia(incidente, "H2", "apos correcao p95 80.0 ms, erro 0.001", "confirma")
    veredito = er.veredito_runbook([regressao_no_corrigido])
    assert veredito == "mitigado"
    texto = ri.gerar_incident_md(incidente)
    assert "- H1: refuta" in texto
    assert "- H2: confirma" in texto


def test_amostra_seedada_deterministica() -> None:
    rng = random.Random(SEMENTE)
    sufixos_a = [rng.randint(0, 9999) for _ in range(AMOSTRA)]
    rng = random.Random(SEMENTE)
    sufixos_b = [rng.randint(0, 9999) for _ in range(AMOSTRA)]
    assert sufixos_a == sufixos_b
    alvo = er.AlvoLocal("saudavel")
    leituras = [alvo.observar() for _ in range(AMOSTRA)]
    assert len(leituras) == AMOSTRA
    assert all(leitura == {"p95_ms": 80.0, "taxa_erro": 0.001} for leitura in leituras)
