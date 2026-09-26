"""Fitness de cobertura de decisão + CLI com exit code (AT-011/012)."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from design_guard.fitness import areas_sem_decisao

LAB = Path(__file__).resolve().parent.parent


def test_area_sem_decisao_e_apontada() -> None:
    faltas = areas_sem_decisao(LAB / "demo_src", LAB / "demo_docs")
    assert [f.area for f in faltas] == ["notify"]


def test_allowlist_explicita_dispensa() -> None:
    assert areas_sem_decisao(LAB / "demo_src", LAB / "demo_docs", frozenset({"notify"})) == []


def _run_cli(raiz: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "design_guard.cli", "--raiz", str(raiz)],
        cwd=LAB,
        capture_output=True,
        text=True,
        check=False,
    )


def test_cli_reprova_demo_com_violacao() -> None:
    proc = _run_cli(LAB)
    assert proc.returncode == 1
    assert "DOC LINT FALHOU" in proc.stdout


def test_cli_aprova_demo_limpa(tmp_path: Path) -> None:
    limpa = tmp_path / "limpa"
    shutil.copytree(LAB / "demo_docs", limpa / "demo_docs")
    (limpa / "demo_docs" / "adr" / "0002-formato-de-log.md").unlink()
    (limpa / "demo_docs" / "AGENTS.md").write_text("# AGENTS\n", encoding="utf-8")
    proc = _run_cli(limpa)
    assert proc.returncode == 0, proc.stdout
    assert "DOC LINT OK" in proc.stdout


def test_cli_mutante_ref_quebrada(tmp_path: Path) -> None:
    alvo = tmp_path / "mutante"
    shutil.copytree(LAB / "demo_docs", alvo / "demo_docs")
    (alvo / "demo_docs" / "adr" / "0002-formato-de-log.md").unlink()
    runbook = alvo / "demo_docs" / "runbook.md"
    runbook.write_text(
        runbook.read_text(encoding="utf-8") + "\nver `src/app/inexistente.py`\n", encoding="utf-8"
    )
    proc = _run_cli(alvo)
    assert proc.returncode == 1
    assert "ref-quebrada" in proc.stdout
