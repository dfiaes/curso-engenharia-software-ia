#!/usr/bin/env python3
"""Evals agnósticos de agente e de modelo (só biblioteca padrão, Python 3.11+).

Responde a duas perguntas com método:
  (a) a minha skill continua útil?            -> --skill-ab nome
  (b) um modelo mais barato entrega o mesmo?  -> --variantes grande,pequeno

Uso (a partir da raiz do projeto):
    python3 evals/run_evals.py --variantes a,b --casos all --repeticoes 3 --paralelo 4
    python3 evals/run_evals.py --skill-ab minha-skill --variantes a --casos all --repeticoes 3
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import shlex
import shutil
import signal
import statistics
import subprocess
import sys
import tempfile
import time
import tomllib
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Sequence

EVALS_DIR = Path(__file__).resolve().parent
SEGREDO_RE = re.compile(r"(KEY|TOKEN|SECRET|PASSWORD|SENHA)", re.I)
ND = "n/d"


# ----------------------------------------------------------------------------- modelos de dados

@dataclass
class Caso:
    id: str
    descricao: str
    prompt: str
    tags: list[str] = field(default_factory=list)
    dificuldade: str = "media"
    fixture: Path | None = None
    comando: str | None = None
    regex_saida: str | None = None
    arquivos_esperados: list[str] = field(default_factory=list)
    deve_acionar_skill: bool | None = None


@dataclass
class Variante:
    nome: str
    comando: str
    modelo: str = ""
    env: dict[str, str] = field(default_factory=dict)
    preco_entrada_mtok: float | None = None
    preco_saida_mtok: float | None = None
    regex_tokens: str | None = None
    regex_acionamento_skill: str | None = None
    com_skill: dict[str, Any] | None = None
    sem_skill: dict[str, Any] | None = None


# ----------------------------------------------------------------------------- carga de TOML

def _validar_env(nome: str, env: dict[str, Any]) -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in env.items():
        v = str(v)
        if SEGREDO_RE.search(k) and "$" not in v:
            raise ValueError(
                f"variante '{nome}': env {k} parece segredo literal; use referência a variável de ambiente, ex.: \"${k}\""
            )
        out[k] = v
    return out


def carregar_casos(casos_dir: Path) -> list[Caso]:
    casos: list[Caso] = []
    for arq in sorted(casos_dir.glob("*.toml")):
        if arq.name.startswith("_"):
            continue
        data = tomllib.loads(arq.read_text(encoding="utf-8"))
        itens = data["caso"] if isinstance(data.get("caso"), list) else [data]
        for d in itens:
            casos.append(_caso_de_dict(d, arq))
    ids = [c.id for c in casos]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        raise ValueError(f"ids de caso duplicados: {sorted(dup)}")
    return casos


def _caso_de_dict(d: dict[str, Any], arq: Path) -> Caso:
    for obrigatorio in ("id", "prompt"):
        if obrigatorio not in d:
            raise ValueError(f"{arq.name}: campo obrigatório ausente: {obrigatorio}")
    v = d.get("verificar", {})
    if not (v.get("comando") or v.get("regex_saida") or v.get("arquivos_esperados")):
        raise ValueError(f"{arq.name}: caso '{d['id']}' sem verificação objetiva (verificar.comando/regex_saida/arquivos_esperados)")
    fixture = (arq.parent / d["fixture"]).resolve() if d.get("fixture") else None
    if fixture and not fixture.is_dir():
        raise ValueError(f"{arq.name}: fixture não encontrada: {fixture}")
    return Caso(
        id=d["id"], descricao=d.get("descricao", ""), prompt=d["prompt"], tags=list(d.get("tags", [])),
        dificuldade=d.get("dificuldade", "media"), fixture=fixture, comando=v.get("comando"),
        regex_saida=v.get("regex_saida"), arquivos_esperados=list(v.get("arquivos_esperados", [])),
        deve_acionar_skill=d.get("deve_acionar_skill"),
    )


def carregar_variantes(arquivo: Path) -> tuple[list[Variante], dict[str, Any]]:
    data = tomllib.loads(arquivo.read_text(encoding="utf-8"))
    out: list[Variante] = []
    for d in data.get("variante", []):
        for obrigatorio in ("nome", "comando"):
            if obrigatorio not in d:
                raise ValueError(f"{arquivo.name}: variante sem '{obrigatorio}'")
        for bloco in ("com_skill", "sem_skill"):
            if bloco in d and "env" in d[bloco]:
                d[bloco]["env"] = _validar_env(d["nome"], d[bloco]["env"])
        out.append(Variante(
            nome=d["nome"], comando=d["comando"], modelo=d.get("modelo", ""),
            env=_validar_env(d["nome"], d.get("env", {})),
            preco_entrada_mtok=d.get("preco_entrada_mtok"), preco_saida_mtok=d.get("preco_saida_mtok"),
            regex_tokens=d.get("regex_tokens"), regex_acionamento_skill=d.get("regex_acionamento_skill"),
            com_skill=d.get("com_skill"), sem_skill=d.get("sem_skill"),
        ))
    nomes = [v.nome for v in out]
    if len(set(nomes)) != len(nomes):
        raise ValueError("nomes de variante duplicados")
    return out, data.get("config", {})


def selecionar_casos(casos: list[Caso], filtro: str) -> list[Caso]:
    if filtro.strip().lower() == "all":
        return casos
    pedidos = {p.strip() for p in filtro.split(",") if p.strip()}
    sel = [c for c in casos if c.id in pedidos or pedidos & set(c.tags)]
    if not sel:
        raise ValueError(f"nenhum caso casa com '{filtro}'")
    return sel


def expandir_skill_ab(base: Variante, skill: str) -> tuple[Variante, Variante]:
    """Cria as variantes 'com' e 'sem' a partir dos blocos com_skill/sem_skill da variante base."""
    if base.com_skill is None or base.sem_skill is None:
        raise ValueError(f"variante '{base.nome}' precisa declarar [variante.com_skill] e [variante.sem_skill] para --skill-ab")
    pares = []
    for modo, bloco in (("com", base.com_skill), ("sem", base.sem_skill)):
        env = {**base.env, **bloco.get("env", {}), "EVAL_SKILL": skill, "EVAL_SKILL_MODO": modo}
        pares.append(Variante(
            nome=f"{base.nome}+{modo}-skill", comando=bloco.get("comando", base.comando).replace("{skill}", skill),
            modelo=base.modelo, env=env, preco_entrada_mtok=base.preco_entrada_mtok,
            preco_saida_mtok=base.preco_saida_mtok, regex_tokens=base.regex_tokens,
            regex_acionamento_skill=base.regex_acionamento_skill,
        ))
    return pares[0], pares[1]


# ----------------------------------------------------------------------------- execução

def _rodar(cmd: str, cwd: Path, env: dict[str, str], timeout: float) -> tuple[int | None, str, float]:
    """Roda `cmd` no shell; devolve (exit, saída, segundos). exit None = timeout (grupo de processos morto)."""
    t0 = time.monotonic()
    p = subprocess.Popen(cmd, shell=True, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         text=True, errors="replace", start_new_session=True)
    try:
        out, _ = p.communicate(timeout=timeout)
        return p.returncode, out or "", time.monotonic() - t0
    except subprocess.TimeoutExpired:
        try:
            os.killpg(p.pid, signal.SIGKILL)
        except (ProcessLookupError, PermissionError):
            p.kill()
        out, _ = p.communicate()
        return None, out or "", time.monotonic() - t0


def extrair_tokens(regex: str | None, saida: str) -> tuple[int | None, int | None]:
    """Usa grupos nomeados (?P<entrada>..)(?P<saida>..) ou os dois primeiros grupos posicionais."""
    if not regex:
        return None, None
    m = re.search(regex, saida)
    if not m:
        return None, None
    gd = m.groupdict()
    try:
        if "entrada" in gd and "saida" in gd:
            return int(gd["entrada"].replace(",", "").replace(".", "")), int(gd["saida"].replace(",", "").replace(".", ""))
        g = m.groups()
        return int(g[0].replace(",", "").replace(".", "")), int(g[1].replace(",", "").replace(".", ""))
    except (ValueError, IndexError, AttributeError):
        return None, None


def calcular_custo(v: Variante, ent: int | None, sai: int | None) -> float | None:
    if ent is None or sai is None or v.preco_entrada_mtok is None or v.preco_saida_mtok is None:
        return None
    return ent / 1e6 * v.preco_entrada_mtok + sai / 1e6 * v.preco_saida_mtok


def executar_tentativa(caso: Caso, v: Variante, tentativa: int, timeout: float) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="eval-") as tmp:
        raiz = Path(tmp)
        work = raiz / "work"
        if caso.fixture:
            shutil.copytree(caso.fixture, work)
        else:
            work.mkdir()
        prompt_file = raiz / "prompt.txt"
        prompt_file.write_text(caso.prompt, encoding="utf-8")
        env = {**os.environ}
        env.update({
            "PYTHON": sys.executable, "EVALS_DIR": str(EVALS_DIR), "EVAL_CASO_ID": caso.id,
            "EVAL_DIFICULDADE": caso.dificuldade, "EVAL_TENTATIVA": str(tentativa), "EVAL_VARIANTE": v.nome,
            "EVAL_MODELO": v.modelo, "EVAL_DEVE_ACIONAR_SKILL": "" if caso.deve_acionar_skill is None else str(int(caso.deve_acionar_skill)),
        })
        env.update({k: os.path.expandvars(val) for k, val in v.env.items()})
        cmd = v.comando.replace("{prompt_file}", shlex.quote(str(prompt_file))).replace("{workdir}", shlex.quote(str(work)))
        rc, saida, lat = _rodar(cmd, work, env, timeout)
        ent, sai = extrair_tokens(v.regex_tokens, saida)
        acionou = bool(re.search(v.regex_acionamento_skill, saida)) if v.regex_acionamento_skill else None
        sucesso, motivo = True, ""
        if rc is None:
            sucesso, motivo = False, "timeout"
        elif rc != 0:
            sucesso, motivo = False, f"agente_erro (exit {rc})"
        else:
            sucesso, motivo = _verificar(caso, work, saida, env, timeout)
        return {
            "caso": caso.id, "variante": v.nome, "modelo": v.modelo, "tentativa": tentativa, "sucesso": sucesso,
            "motivo": motivo, "latencia_s": round(lat, 3), "tokens_entrada": ent, "tokens_saida": sai,
            "custo": calcular_custo(v, ent, sai), "acionou_skill": acionou, "deve_acionar_skill": caso.deve_acionar_skill,
        }


def _verificar(caso: Caso, work: Path, saida: str, env: dict[str, str], timeout: float) -> tuple[bool, str]:
    if caso.arquivos_esperados:
        faltam = [a for a in caso.arquivos_esperados if not (work / a).exists()]
        if faltam:
            return False, f"verificar.arquivos_esperados (faltam: {', '.join(faltam)})"
    if caso.regex_saida and not re.search(caso.regex_saida, saida, re.M):
        return False, "verificar.regex_saida"
    if caso.comando:
        rc, _, _ = _rodar(caso.comando, work, env, min(timeout, 120))
        if rc is None:
            return False, "verificar.comando (timeout)"
        if rc != 0:
            return False, f"verificar.comando (exit {rc})"
    return True, ""


def executar(casos: list[Caso], variantes: list[Variante], repeticoes: int, timeout: float, paralelo: int) -> list[dict[str, Any]]:
    jobs = [(c, v, t) for v in variantes for c in casos for t in range(1, repeticoes + 1)]
    with ThreadPoolExecutor(max_workers=max(1, paralelo)) as ex:
        res = list(ex.map(lambda j: executar_tentativa(j[0], j[1], j[2], timeout), jobs))
    return res


# ----------------------------------------------------------------------------- estatística

def por_caso(registros: list[dict[str, Any]], variante: str) -> dict[str, list[bool]]:
    out: dict[str, list[bool]] = {}
    for r in sorted((r for r in registros if r["variante"] == variante), key=lambda r: (r["caso"], r["tentativa"])):
        out.setdefault(r["caso"], []).append(bool(r["sucesso"]))
    return out


def pass_metricas(resultados: dict[str, list[bool]]) -> dict[str, float]:
    """pass@1 médio, pass^k (todas as k OK) e pass@k (alguma OK), todos em fração de casos."""
    if not resultados:
        return {"pass1": 0.0, "pass_k": 0.0, "pass_at_k": 0.0, "casos": 0}
    n = len(resultados)
    return {
        "pass1": sum(sum(t) / len(t) for t in resultados.values()) / n,
        "pass_k": sum(all(t) for t in resultados.values()) / n,
        "pass_at_k": sum(any(t) for t in resultados.values()) / n,
        "casos": n,
    }


def percentil(valores: Sequence[float], p: float) -> float | None:
    if not valores:
        return None
    s = sorted(valores)
    if len(s) == 1:
        return s[0]
    pos = (len(s) - 1) * p / 100
    lo, hi = math.floor(pos), math.ceil(pos)
    return s[lo] + (s[hi] - s[lo]) * (pos - lo)


def resumo_variante(registros: list[dict[str, Any]], variante: str) -> dict[str, Any]:
    rs = [r for r in registros if r["variante"] == variante]
    m = pass_metricas(por_caso(registros, variante))
    sucessos = sum(1 for r in rs if r["sucesso"])
    custos = [r["custo"] for r in rs if r["custo"] is not None]
    completo = bool(rs) and len(custos) == len(rs)
    custo_total = sum(custos) if custos else None
    custo_por_sucesso = (custo_total / sucessos) if (completo and sucessos > 0 and custo_total is not None) else None
    falhas: dict[str, int] = {}
    for r in rs:
        if not r["sucesso"]:
            chave = re.sub(r"\s*\(.*\)$", "", r["motivo"]) or "desconhecido"
            falhas[chave] = falhas.get(chave, 0) + 1
    lat = [r["latencia_s"] for r in rs]
    return {**m, "variante": variante, "tentativas": len(rs), "sucessos": sucessos, "custo_total": custo_total,
            "custo_completo": completo, "custo_por_sucesso": custo_por_sucesso,
            "p50": percentil(lat, 50), "p95": percentil(lat, 95), "falhas": falhas,
            "modelo": rs[0].get("modelo", "") if rs else ""}


def mcnemar_exato(b: int, c: int) -> float:
    """Teste de McNemar exato (binomial bicaudal, p0=0.5) sobre os pares discordantes b e c."""
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    cauda = sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n
    return min(1.0, 2 * cauda)


def comparar(registros: list[dict[str, Any]], a: str, b: str, tolerancia: float) -> dict[str, Any]:
    ra, rb = por_caso(registros, a), por_caso(registros, b)
    comuns = sorted(set(ra) & set(rb))
    mudaram, so_a, so_b = [], 0, 0
    for c in comuns:
        oa, ob = all(ra[c]), all(rb[c])
        if oa and not ob:
            so_a += 1
            mudaram.append((c, "ok", "falha"))
        elif ob and not oa:
            so_b += 1
            mudaram.append((c, "falha", "ok"))
    p = mcnemar_exato(so_a, so_b)
    sa, sb = resumo_variante(registros, a), resumo_variante(registros, b)
    perda = sa["pass_k"] - sb["pass_k"]
    ca, cb = sa["custo_por_sucesso"], sb["custo_por_sucesso"]
    if perda > tolerancia:
        rec = f"MANTER {a}: {b} perde {perda:.1%} de pass^k, acima da tolerância de {tolerancia:.1%}."
    elif ca is None or cb is None:
        rec = f"MANTER {a} por ora: perda dentro da tolerância, mas falta custo medido (configure regex_tokens e preços) para provar economia."
    elif cb < ca:
        rec = f"TROCAR {a} por {b}: perda de pass^k ({perda:.1%}) dentro da tolerância ({tolerancia:.1%}) e custo por sucesso cai de {ca:.4f} para {cb:.4f}."
    else:
        rec = f"MANTER {a}: perda dentro da tolerância, mas o custo por sucesso não cai ({ca:.4f} -> {cb:.4f})."
    if len(comuns) < 20:
        rec += f" Atenção: só {len(comuns)} casos; com menos de 20 a decisão é frágil."
    ruido = p >= 0.05
    frase = (f"diferença não distinguível de ruído com {len(comuns)} casos" if ruido
             else f"diferença estatisticamente detectável (p < 0.05) com {len(comuns)} casos")
    return {"a": a, "b": b, "n": len(comuns), "mudaram": mudaram, "so_a": so_a, "so_b": so_b, "p": p,
            "frase": frase, "ruido": ruido, "perda": perda, "recomendacao": rec}


def acionamento(registros: list[dict[str, Any]], variante: str) -> dict[str, Any]:
    rs = [r for r in registros if r["variante"] == variante and r.get("deve_acionar_skill") is not None]
    if not rs or any(r["acionou_skill"] is None for r in rs):
        return {"disponivel": False, "total": len(rs)}
    ok = sum(1 for r in rs if r["acionou_skill"] == r["deve_acionar_skill"])
    fp = sum(1 for r in rs if r["acionou_skill"] and not r["deve_acionar_skill"])
    fn = sum(1 for r in rs if not r["acionou_skill"] and r["deve_acionar_skill"])
    return {"disponivel": True, "total": len(rs), "corretos": ok, "falsos_positivos": fp, "falsos_negativos": fn}


def veredito_skill(registros: list[dict[str, Any]], com: str, sem: str, tolerancia: float) -> dict[str, Any]:
    cmp = comparar(registros, sem, com, tolerancia)
    ganho = -cmp["perda"]
    if ganho > tolerancia:
        v = "útil"
        txt = "a skill melhora o pass^k além da tolerância. Mantenha e acompanhe."
    elif ganho < -tolerancia:
        v = "prejudicial"
        txt = "a skill piora o pass^k além da tolerância. Corrija ou desative até entender o motivo."
    else:
        v = "neutra"
        txt = "sem ganho além da tolerância: candidata a enxugar (menos texto, menos contexto) ou a aposentar."
    return {"veredito": v, "ganho": ganho, "texto": txt, "cmp": cmp, "acionamento": acionamento(registros, com)}


# ----------------------------------------------------------------------------- relatório

def _pct(x: float) -> str:
    return f"{x * 100:.0f}%"


def _usd(x: float | None, parcial: bool = False) -> str:
    if x is None:
        return ND
    return f"US$ {x:.4f}" + (" (parcial)" if parcial else "")


def _seg(x: float | None) -> str:
    return ND if x is None else f"{x:.2f}s"


def gerar_relatorio(registros: list[dict[str, Any]], variantes: list[str], meta: dict[str, Any], tolerancia: float,
                    skill_ab: dict[str, tuple[str, str]] | None = None) -> str:
    L: list[str] = []
    L.append("# Relatório de evals")
    L.append("")
    L.append(f"- Data: {meta.get('data', '')}")
    L.append(f"- Casos: {meta.get('casos', '?')} | repetições (k): {meta.get('repeticoes', '?')} | tentativas: {len(registros)}")
    L.append(f"- Tolerância de pass^k: {tolerancia:.1%}")
    L.append("")
    L.append("## Resumo por variante")
    L.append("")
    L.append("| Variante | Modelo | pass@1 médio | pass^k | pass@k | Custo total | Custo/sucesso | Latência p50 | p95 |")
    L.append("|---|---|---|---|---|---|---|---|---|")
    resumos = {v: resumo_variante(registros, v) for v in variantes}
    for v in variantes:
        s = resumos[v]
        parcial = s["custo_total"] is not None and not s["custo_completo"]
        L.append(f"| {v} | {s['modelo'] or ND} | {_pct(s['pass1'])} | {_pct(s['pass_k'])} | {_pct(s['pass_at_k'])} | "
                 f"{_usd(s['custo_total'], parcial)} | {_usd(s['custo_por_sucesso'])} | {_seg(s['p50'])} | {_seg(s['p95'])} |")
    L.append("")
    L.append("Legenda: **pass@1 médio** = taxa média de acerto por tentativa; **pass^k** = fração de casos em que TODAS as k tentativas acertaram (confiabilidade); "
             "**pass@k** = fração de casos em que ALGUMA tentativa acertou (capacidade); custo/sucesso = custo total / tentativas bem-sucedidas (n/d se faltar uso de tokens ou preço).")
    L.append("")
    L.append("## Falhas por motivo")
    L.append("")
    L.append("| Variante | Motivo | Ocorrências |")
    L.append("|---|---|---|")
    algum = False
    for v in variantes:
        for motivo, n in sorted(resumos[v]["falhas"].items(), key=lambda kv: -kv[1]):
            L.append(f"| {v} | {motivo} | {n} |")
            algum = True
    if not algum:
        L.append("| - | nenhuma falha | 0 |")
    L.append("")
    L.append("## Detalhe por caso (pass^k: tentativas ok/total)")
    L.append("")
    casos = sorted({r["caso"] for r in registros})
    L.append("| Caso | " + " | ".join(variantes) + " |")
    L.append("|---|" + "---|" * len(variantes))
    pc = {v: por_caso(registros, v) for v in variantes}
    for c in casos:
        cel = []
        for v in variantes:
            t = pc[v].get(c, [])
            cel.append(f"{sum(t)}/{len(t)}" if t else "-")
        L.append(f"| {c} | " + " | ".join(cel) + " |")
    L.append("")
    pares: list[tuple[str, str]] = []
    if skill_ab:
        pares = [(sem, com) for (com, sem) in skill_ab.values()]
    elif len(variantes) >= 2:
        pares = [(variantes[0], v) for v in variantes[1:]]
    if pares:
        L.append("## Comparação pareada")
        L.append("")
        L.append("Regras (fixas, para a decisão ser reprodutível): (1) perda = pass^k(A) - pass^k(B); (2) só se recomenda trocar A por B se a perda for "
                 f"<= tolerância ({tolerancia:.1%}) **e** o custo por sucesso de B for menor que o de A; (3) sem custo medido, mantém-se A; "
                 "(4) o McNemar exato avalia se os casos que mudaram de resultado excedem o acaso (p < 0.05); (5) menos de 20 casos = decisão frágil.")
        L.append("")
        for a, b in pares:
            c = comparar(registros, a, b, tolerancia)
            L.append(f"### A = {a}  vs  B = {b}")
            L.append("")
            if c["mudaram"]:
                L.append(f"| Caso | A ({a}) | B ({b}) |")
                L.append("|---|---|---|")
                for caso, ra_, rb_ in c["mudaram"]:
                    L.append(f"| {caso} | {ra_} | {rb_} |")
            else:
                L.append("Nenhum caso mudou de resultado (pass^k).")
            L.append("")
            L.append(f"- A ok / B falha: {c['so_a']} | A falha / B ok: {c['so_b']}")
            L.append(f"- McNemar exato (pass^k por caso): p = {c['p']:.4f}: {c['frase']}.")
            L.append(f"- **Recomendação:** {c['recomendacao']}")
            L.append("")
    if skill_ab:
        L.append("## Modo skill")
        L.append("")
        for nome_skill, (com, sem) in skill_ab.items():
            vd = veredito_skill(registros, com, sem, tolerancia)
            L.append(f"### Skill `{nome_skill}` ({com} vs {sem})")
            L.append("")
            L.append(f"- Ganho de pass^k (com - sem): {round(vd['ganho'] * 100):+d} pontos percentuais")
            ac = vd["acionamento"]
            if ac["disponivel"]:
                L.append(f"- Acionamento nos casos com `deve_acionar_skill` ({ac['total']} tentativas): corretos {ac['corretos']}, "
                         f"falsos positivos {ac['falsos_positivos']}, falsos negativos {ac['falsos_negativos']}")
            else:
                L.append(f"- Acionamento: {ND} (defina `deve_acionar_skill` nos casos e `regex_acionamento_skill` na variante)")
            L.append(f"- **Veredito: {vd['veredito']}**: {vd['texto']}")
            L.append("")
    return "\n".join(L) + "\n"


# ----------------------------------------------------------------------------- CLI

def main(argv: Sequence[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--variantes", default="", help="nomes separados por vírgula (padrão: todas); a primeira é a linha de base")
    ap.add_argument("--casos", default="all", help="all, ids ou tags separados por vírgula")
    ap.add_argument("--repeticoes", type=int, default=3)
    ap.add_argument("--timeout", type=float, default=600, help="segundos por tentativa")
    ap.add_argument("--paralelo", type=int, default=1)
    ap.add_argument("--saida", type=Path, default=None)
    ap.add_argument("--skill-ab", default=None, metavar="NOME", help="compara a variante com e sem a skill NOME")
    ap.add_argument("--tolerancia", type=float, default=None, help="perda máxima aceitável de pass^k (fração; padrão 0.05)")
    ap.add_argument("--config", type=Path, default=EVALS_DIR / "variantes.toml")
    ap.add_argument("--casos-dir", type=Path, default=EVALS_DIR / "casos")
    args = ap.parse_args(argv)
    try:
        todas, cfg = carregar_variantes(args.config)
        tol = args.tolerancia if args.tolerancia is not None else float(cfg.get("tolerancia_pass_k", 0.05))
        if not todas:
            ap.error(f"nenhuma variante em {args.config} (descomente/crie uma; veja exemplos/variantes.toml)")
        nomes = [n.strip() for n in args.variantes.split(",") if n.strip()]
        por_nome = {v.nome: v for v in todas}
        faltam = [n for n in nomes if n not in por_nome]
        if faltam:
            ap.error(f"variante(s) desconhecida(s): {faltam}; existentes: {list(por_nome)}")
        base = [por_nome[n] for n in nomes] or todas
        casos = selecionar_casos(carregar_casos(args.casos_dir), args.casos)
        skill_ab: dict[str, tuple[str, str]] | None = None
        if args.skill_ab:
            exec_vars: list[Variante] = []
            skill_ab = {}
            for b in base:
                com, sem = expandir_skill_ab(b, args.skill_ab)
                exec_vars += [com, sem]
                skill_ab[f"{args.skill_ab}" if len(base) == 1 else f"{args.skill_ab} [{b.nome}]"] = (com.nome, sem.nome)
        else:
            exec_vars = base
    except (ValueError, OSError, tomllib.TOMLDecodeError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 2
    agora = datetime.now()
    saida = args.saida or (EVALS_DIR / "resultados" / agora.strftime("%Y%m%d-%H%M%S"))
    saida.mkdir(parents=True, exist_ok=True)
    print(f"{len(casos)} casos x {len(exec_vars)} variantes x {args.repeticoes} repetições", file=sys.stderr)
    regs = executar(casos, exec_vars, args.repeticoes, args.timeout, args.paralelo)
    with (saida / "resultados.jsonl").open("w", encoding="utf-8") as f:
        for r in regs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    meta = {"data": agora.strftime("%Y-%m-%d %H:%M:%S"), "casos": len(casos), "repeticoes": args.repeticoes}
    rel = gerar_relatorio(regs, [v.nome for v in exec_vars], meta, tol, skill_ab)
    (saida / "relatorio.md").write_text(rel, encoding="utf-8")
    print(rel)
    print(f"gravado em {saida}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
