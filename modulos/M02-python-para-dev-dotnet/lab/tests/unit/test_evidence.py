import json
from pathlib import Path

from python_senior_lab.evidence import EvidenceTimer, sha256_file, write_evidence


def test_evidence_has_hashes_versions_runtime_and_duration(tmp_path: Path) -> None:
    source = tmp_path / "source.csv"
    output = tmp_path / "output.csv"
    evidence_path = tmp_path / "run.json"
    source.write_text("source", encoding="utf-8")
    output.write_text("output", encoding="utf-8")

    evidence = EvidenceTimer().finish(input_path=source, output_path=output, rows=1)
    write_evidence(evidence_path, evidence)
    payload = json.loads(evidence_path.read_text(encoding="utf-8"))

    assert payload["schema_version"] == "1.0"
    assert payload["runtime"]["version"].startswith("3.14")
    assert payload["input"]["sha256"] == sha256_file(source)
    assert payload["output"]["rows"] == 1
    assert payload["duration_ms"] >= 0
