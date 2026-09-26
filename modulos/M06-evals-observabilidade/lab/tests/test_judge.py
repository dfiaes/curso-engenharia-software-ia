"""Juiz roteirizado: acordo medido, desalinhado rejeitado (AT-006/007)."""

from __future__ import annotations

import pytest

from eval_lab.judge import (
    JuizDesalinhado,
    JuizRoteirizado,
    JuizSempreSim,
    Rotulo,
    medir_acordo,
)


def _rotulos() -> list[Rotulo]:
    """Fixture didática roteirizada; estes dados não são rótulos humanos coletados."""
    return [
        Rotulo("def f(): pass", "sem lógica, nada a dizer", False),
        Rotulo("def f(): pass", "risco alto: buffer overflow na linha 1", False),
        Rotulo("while True: senha = input()", "loop sem saída com leitura sensível", True),
        Rotulo("x = 1", "risco alto", False),
        Rotulo("os.system(cmd)", "execução de comando com entrada externa", True),
        Rotulo("import os", "risco crítico de kernel", False),
        Rotulo("eval(dado)", "avaliação dinâmica de dado externo", True),
        Rotulo("y = 2", "nada relevante", False),
        Rotulo("subprocess.run(s)", "processo filho com dado variável", True),
        Rotulo("z = 3", "ok", False),
    ]


def _regra_evidencia(codigo: str, just: str) -> bool:
    perigosas = ("input(", "os.system", "eval(", "subprocess", "while True")
    return any(p in codigo for p in perigosas) and any(
        p in just for p in ("loop", "comando", "dinâmica", "processo", "sensível")
    )


def test_juiz_alinhado_passas() -> None:
    juiz = JuizRoteirizado(regras=(_regra_evidencia,))
    acordo = medir_acordo(juiz, _rotulos(), limiar=0.85)
    assert acordo >= 0.85


def test_juiz_sempre_sim_e_rejeitado() -> None:
    with pytest.raises(JuizDesalinhado, match="acordo"):
        medir_acordo(JuizSempreSim(), _rotulos(), limiar=0.85)


def test_juiz_sempre_sim_explora_classe_majoritaria() -> None:
    rotulos = [
        *(Rotulo("x = 1", "justificativa sustentada", True) for _ in range(80)),
        *(Rotulo("x = 1", "alegação sem suporte", False) for _ in range(20)),
    ]
    juiz = JuizSempreSim()
    acertos = sum(juiz.julgar(r.codigo, r.justificativa) == r.rotulo_referencia for r in rotulos)
    acertos_na_classe_negativa = sum(
        not juiz.julgar(r.codigo, r.justificativa) for r in rotulos if not r.rotulo_referencia
    )

    assert acertos / len(rotulos) == 0.8
    assert medir_acordo(juiz, rotulos, limiar=0.8) == 0.8
    assert acertos_na_classe_negativa == 0


def test_calibrar_exige_referencia_nao_vazia_e_limiar_valido() -> None:
    juiz = JuizSempreSim()
    with pytest.raises(ValueError, match="ao menos um"):
        medir_acordo(juiz, [], limiar=0.85)
    with pytest.raises(ValueError, match="entre 0 e 1"):
        medir_acordo(juiz, _rotulos(), limiar=1.1)
