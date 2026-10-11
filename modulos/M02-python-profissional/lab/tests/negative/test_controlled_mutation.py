import os
import subprocess
import sys
from pathlib import Path


def _run_invariant_probe(workspace: Path) -> subprocess.CompletedProcess[str]:
    environment = os.environ.copy()
    environment.pop("PYTHONPATH", None)
    return subprocess.run(
        [sys.executable, "probe.py"],
        cwd=workspace,
        env=environment,
        capture_output=True,
        check=False,
        text=True,
        timeout=5,
    )


def test_removing_positive_amount_rule_is_killed_by_the_oracle(tmp_path: Path) -> None:
    source = (Path(__file__).parents[2] / "src" / "python_senior_lab" / "domain.py").read_text(
        encoding="utf-8"
    )
    mutation_target = "if self.amount <= 0:"
    assert source.count(mutation_target) == 1

    package = tmp_path / "python_senior_lab"
    package.mkdir()
    (package / "__init__.py").write_text("", encoding="utf-8")
    domain_copy = package / "domain.py"
    domain_copy.write_text(source, encoding="utf-8")
    (tmp_path / "probe.py").write_text(
        """from datetime import UTC, datetime
from decimal import Decimal

from python_senior_lab.domain import DomainInvariantError, Transaction

try:
    Transaction(
        transaction_id="tx-mutant",
        amount=Decimal("-1"),
        currency="BRL",
        category="test",
        occurred_at=datetime.now(UTC),
    )
except DomainInvariantError:
    raise SystemExit(0)
raise AssertionError("a regra crítica de amount positivo deixou de ser aplicada")
""",
        encoding="utf-8",
    )

    control = _run_invariant_probe(tmp_path)
    assert control.returncode == 0, control.stderr

    mutant = source.replace(mutation_target, "if False:  # mutante: regra removida")
    domain_copy.write_text(mutant, encoding="utf-8")
    killed = _run_invariant_probe(tmp_path)

    assert killed.returncode != 0
    assert "a regra crítica de amount positivo" in killed.stderr
