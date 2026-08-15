import json
from pathlib import Path


def test_generated_ai_defects_have_traceable_review_and_oracle() -> None:
    fixtures = Path(__file__).parents[2] / "fixtures" / "generated_defects"
    payload = json.loads((fixtures / "catalog.json").read_text(encoding="utf-8"))

    assert payload["schema_version"] == "1.0"
    assert len(payload["defects"]) >= 4
    for defect in payload["defects"]:
        assert (fixtures / defect["file"]).is_file()
        for field in ("type_issue", "semantic_issue", "operational_risk", "oracle"):
            assert defect[field].strip()
