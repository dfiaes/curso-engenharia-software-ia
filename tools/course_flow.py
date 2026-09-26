"""Small local coordinator; never runs models, certifies content or promotes gates."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from backlog_tasks import ROOT, Task, build_tasks

STATUS = ROOT / "docs/STATUS-IMPLEMENTACAO-CURSO.md"
LOCK = ROOT / "docs/planejamento-v4/.execution-lock"
STATES = {
    "PLANEJADO",
    "EM_EXECUCAO",
    "AGUARDA_REVISAO",
    "AJUSTES_NECESSARIOS",
    "BLOQUEADO",
    "REVISADO",
}


def field(text: str, name: str) -> str:
    match = re.search(
        r"^\*\*" + re.escape(name) + r":\*\*\s*([^\n]+)", text, re.MULTILINE
    )
    return match.group(1).strip() if match else ""


def evidence(task: Task, root: Path) -> tuple[str, str, str]:
    path = root / task.evidence
    if not path.exists():
        return "PLANEJADO", "", ""
    text = path.read_text(encoding="utf-8")
    state = field(text, "Estado")
    if state not in STATES:
        raise ValueError(
            f"{task.id}: Estado ausente/inválido no relatório; reconciliar sem presumir aprovação"
        )
    author = field(text, "Sessão de autoria")
    reviewer = field(text, "Sessão de revisão")
    if state == "REVISADO" and (
        not author or not reviewer or reviewer == "pendente" or author == reviewer
    ):
        raise ValueError(
            f"{task.id}: revisão sem autoria/revisor distintos registrados"
        )
    return state, author, reviewer


def choose(tasks: list[Task], root: Path, run: str, status: str) -> dict[str, object]:
    if field(status, "Automação") != "ATIVA":
        return {"action": "PAUSADA"}
    records = {t.id: evidence(t, root) for t in tasks}
    approved = {key for key, value in records.items() if value[0] == "REVISADO"}
    for task in tasks:
        if task.id in approved and not set(task.depends_on) <= approved:
            raise ValueError(
                f"{task.id}: revisão depende de cartão ainda não revisado; reconciliar/reabrir"
            )
    core_done = all(t.id in approved for t in tasks if t.track == "core")
    track = "appendix" if core_done else "core"
    eligible = [t for t in tasks if t.track == track and set(t.depends_on) <= approved]
    active = re.search(r"\*\*Unidade ativa: ([A-Z0-9-]+)", status)
    active_id = active.group(1) if active else ""
    # Prefer current operational priority within each phase, then catalog order.
    eligible.sort(key=lambda t: t.id != active_id)
    for states, action in [
        ({"AGUARDA_REVISAO"}, "REVISAR"),
        ({"AJUSTES_NECESSARIOS", "EM_EXECUCAO"}, "IMPLEMENTAR"),
        ({"PLANEJADO"}, "IMPLEMENTAR"),
    ]:
        for task in eligible:
            state, author, reviewer = records[task.id]
            if state not in states or (
                action == "REVISAR" and run in {author, reviewer}
            ):
                continue
            return {
                "action": action,
                "task": task.id,
                "state": state,
                "track": track,
                "evidence": task.evidence,
                "packet": f"python3 tools/backlog_tasks.py --task {task.id} --bundle",
            }
    remaining = [t.id for t in tasks if t.track == track and t.id not in approved]
    return {
        "action": "CONCLUIDO" if not remaining else "AGUARDAR",
        "track": track,
        "remaining": len(remaining),
        "blocked": [t.id for t in eligible if records[t.id][0] == "BLOQUEADO"],
        "note": "Aguardar revisão em outra execução ou resolver bloqueio real; não repetir sem mudança.",
    }


def acquire(lock: Path, run: str) -> bool:
    try:
        lock.mkdir()
    except FileExistsError:
        return False
    (lock / "owner.txt").write_text(run, encoding="utf-8")
    return True


def release(lock: Path, run: str) -> None:
    if (lock / "owner.txt").read_text(encoding="utf-8") != run:
        raise ValueError("Lock pertence a outra execução; não remover")
    (lock / "owner.txt").unlink()
    lock.rmdir()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "action", choices=("next", "acquire", "release", "pause", "resume")
    )
    parser.add_argument(
        "--run", help="ID real da tarefa/sessão do aplicativo, estável nesta execução"
    )
    args = parser.parse_args()
    try:
        if args.action in {"pause", "resume"}:
            text = STATUS.read_text(encoding="utf-8")
            value = "PAUSADA" if args.action == "pause" else "ATIVA"
            text, count = re.subn(
                r"(?m)^\*\*Automação:\*\* (ATIVA|PAUSADA)$",
                f"**Automação:** {value}",
                text,
            )
            if count != 1:
                raise ValueError("Controle da automação ausente/ambíguo")
            STATUS.write_text(text, encoding="utf-8")
            print(value + "; atualizar também o agendamento no aplicativo")
            return 0
        if not args.run:
            parser.error("--run é obrigatório")
        if args.action == "acquire":
            if field(STATUS.read_text(encoding="utf-8"), "Automação") != "ATIVA":
                print("PAUSADA")
                return 2
            if not acquire(LOCK, args.run):
                owner_file = LOCK / "owner.txt"
                print(
                    "OCUPADO: "
                    + (
                        owner_file.read_text()
                        if owner_file.exists()
                        else "inicializando lock"
                    )
                )
                return 2
            print("LOCK_ADQUIRIDO")
        elif args.action == "release":
            release(LOCK, args.run)
            print("LOCK_LIBERADO")
        else:
            print(
                json.dumps(
                    choose(
                        build_tasks(),
                        ROOT,
                        args.run,
                        STATUS.read_text(encoding="utf-8"),
                    ),
                    ensure_ascii=False,
                    indent=2,
                )
            )
    except (ValueError, OSError) as exc:
        print(f"ERRO: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
