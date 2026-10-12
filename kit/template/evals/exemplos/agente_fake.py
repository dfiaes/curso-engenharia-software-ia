#!/usr/bin/env python3
"""Agente FAKE para praticar o sistema de evals sem gastar nada.

Simula modelos com taxas de acerto diferentes, de forma determinística por semente
(mesma semente + modelo + caso + tentativa = mesmo resultado). Não chama nenhuma API.

Lê do ambiente (exportado pelo run_evals.py): EVAL_CASO_ID, EVAL_DIFICULDADE, EVAL_TENTATIVA,
EVAL_SKILL_MODO ("com"/"sem", só no modo --skill-ab) e EVAL_DEVE_ACIONAR_SKILL.
Em caso de acerto copia a solução de exemplos/solucoes/<caso>/ para o workdir; em caso de erro
deixa o código como estava (os testes continuam falhando).
"""
from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import time
from pathlib import Path

# Probabilidade de acerto por dificuldade e preço ilustrativo (US$ por milhão de tokens).
MODELOS = {
    "modelo-grande": {"facil": 0.97, "media": 0.92, "dificil": 0.80, "pre_ent": 3.00, "pre_sai": 15.00, "verbosidade": 1.0},
    "modelo-pequeno": {"facil": 0.95, "media": 0.75, "dificil": 0.35, "pre_ent": 0.25, "pre_sai": 1.25, "verbosidade": 1.4},
}
GANHO_SKILL = 0.20       # a skill ajuda nos casos em que deve ser acionada
PERDA_FALSO_POSITIVO = 0.10
PROB_FALSO_POSITIVO = 0.35  # a skill "dispara à toa" em casos que não são dela
PROB_FALSO_NEGATIVO = 0.10


def sorteio(*partes: object) -> float:
    h = hashlib.sha256("|".join(map(str, partes)).encode()).digest()
    return int.from_bytes(h[:8], "big") / 2**64


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--modelo", required=True, choices=sorted(MODELOS))
    ap.add_argument("--prompt-file", required=True)
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--semente", default="42")
    a = ap.parse_args()

    cfg = MODELOS[a.modelo]
    caso = os.environ.get("EVAL_CASO_ID", "desconhecido")
    dif = os.environ.get("EVAL_DIFICULDADE", "media")
    tentativa = os.environ.get("EVAL_TENTATIVA", "1")
    com_skill = os.environ.get("EVAL_SKILL_MODO") == "com"
    deve = os.environ.get("EVAL_DEVE_ACIONAR_SKILL") == "1"
    prompt = Path(a.prompt_file).read_text(encoding="utf-8")

    chave = (a.semente, a.modelo, caso, tentativa)
    p = cfg[dif]
    acionou = False
    if com_skill:
        if deve:
            acionou = sorteio(*chave, "aciona") >= PROB_FALSO_NEGATIVO
            if acionou:
                p += GANHO_SKILL
        else:
            acionou = sorteio(*chave, "aciona") < PROB_FALSO_POSITIVO
            if acionou:
                p -= PERDA_FALSO_POSITIVO
    acertou = sorteio(*chave, "acerto") < min(max(p, 0.0), 1.0)

    time.sleep(0.01 + 0.04 * sorteio(*chave, "latencia"))
    if acionou:
        print("[skill:corrigir-bug] acionada")
    if acertou:
        sol = Path(__file__).resolve().parent / "solucoes" / caso
        if sol.is_dir():
            shutil.copytree(sol, a.workdir, dirs_exist_ok=True)
        print("Pronto: ajustei o código e rodei os testes.")
    else:
        print("Tentei corrigir, mas não consegui fechar a tarefa.")
    ent = int(900 + len(prompt) * 2 + 200 * sorteio(*chave, "ent"))
    sai = int((500 + 400 * sorteio(*chave, "sai")) * cfg["verbosidade"])
    print(f"uso: entrada={ent} saida={sai}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
