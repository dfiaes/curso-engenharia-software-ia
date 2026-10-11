import json
from pathlib import Path

import pytest

from deploycheck.bicep import check_bicep
from deploycheck.cli import main
from deploycheck.dockerfile import check_dockerfile
from deploycheck.model import Finding, Severity
from deploycheck.runner import check_files
from deploycheck.workflow import check_workflow
from llm_service.config import KNOWN_ENV

LAB = Path(__file__).resolve().parents[1]
DOCKERFILE = LAB / "Dockerfile"
BICEP = LAB / "infra" / "main.bicep"
WORKFLOW = LAB / "ci" / "deploy.yml"


def rules(findings: list[Finding]) -> set[str]:
    return {f.rule for f in findings}


# ---------- controle positivo: os artefatos do lab passam ----------


def test_lab_artifacts_are_clean_even_in_strict_mode() -> None:
    findings = check_files(
        known_env=KNOWN_ENV, dockerfile=DOCKERFILE, bicep=BICEP, workflow=WORKFLOW
    )
    assert findings == []


def test_cli_ok_on_lab_artifacts(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(
        [
            "--strict",
            "--dockerfile",
            str(DOCKERFILE),
            "--bicep",
            str(BICEP),
            "--workflow",
            str(WORKFLOW),
        ]
    )
    assert code == 0
    assert "0 erro(s), 0 aviso(s)" in capsys.readouterr().out


# ---------- Dockerfile ----------

GOOD_DOCKER = """\
FROM python:3.14-slim-bookworm AS build
RUN echo build
FROM python:3.14-slim-bookworm
USER 10001:10001
HEALTHCHECK CMD true
"""


def test_dockerfile_baseline_is_clean() -> None:
    assert check_dockerfile(GOOD_DOCKER) == []


def test_xr001_no_user_means_root() -> None:
    text = GOOD_DOCKER.replace("USER 10001:10001\n", "")
    assert "XR001" in rules(check_dockerfile(text))


@pytest.mark.parametrize("user", ["root", "0", "0:0", "ROOT"])
def test_xr001_explicit_root(user: str) -> None:
    text = GOOD_DOCKER.replace("10001:10001", user)
    assert "XR001" in rules(check_dockerfile(text))


def test_xr001_user_in_build_stage_does_not_count_for_final_stage() -> None:
    text = "FROM python:3.14-slim AS build\nUSER app\nFROM python:3.14-slim\nHEALTHCHECK CMD true\n"
    assert "XR001" in rules(check_dockerfile(text))


@pytest.mark.parametrize("image", ["python", "python:latest", "ghcr.io/x/y"])
def test_xr002_unpinned_base(image: str) -> None:
    text = GOOD_DOCKER.replace("FROM python:3.14-slim-bookworm\n", f"FROM {image}\n")
    assert "XR002" in rules(check_dockerfile(text))


def test_xr002_digest_and_stage_reference_are_accepted() -> None:
    digest = "a" * 64
    text = f"FROM python@sha256:{digest} AS build\nFROM build\nUSER 1000\nHEALTHCHECK CMD true\n"
    assert check_dockerfile(text) == []


def test_xr002_copy_from_image_must_be_pinned() -> None:
    text = GOOD_DOCKER + "COPY --from=ghcr.io/astral-sh/uv /uv /bin/uv\n"
    assert "XR002" in rules(check_dockerfile(text))
    ok = GOOD_DOCKER + "COPY --from=ghcr.io/astral-sh/uv:0.11.32 /uv /bin/uv\n"
    assert check_dockerfile(ok) == []


@pytest.mark.parametrize(
    "line",
    [
        "ENV API_KEY=abc123",
        "ENV DB_PASSWORD hunter2",
        "ARG GH_TOKEN=whatever",
        "ENV X=sk-abcdefghijklmnopqrstuvwxyz0123",
    ],
)
def test_xr003_literal_secret_in_env_or_arg(line: str) -> None:
    assert "XR003" in rules(check_dockerfile(GOOD_DOCKER + line + "\n"))


def test_xr003_non_secret_env_and_secret_without_value_are_fine() -> None:
    text = GOOD_DOCKER + "ENV APP_ENV=prod PYTHONUNBUFFERED=1\nARG TOKEN\n"
    assert check_dockerfile(text) == []


def test_xr010_missing_healthcheck_is_a_warning_only() -> None:
    findings = check_dockerfile(GOOD_DOCKER.replace("HEALTHCHECK CMD true\n", ""))
    assert [(f.rule, f.severity) for f in findings] == [("XR010", Severity.WARN)]


def test_dockerfile_continuations_and_comments() -> None:
    text = (
        "# comentário\nFROM python:3.14-slim\nRUN apt-get update \\\n  && apt-get install -y x\n"
        "ENV A=1 \\\n    B=2\nUSER 5\nHEALTHCHECK NONE\n"
    )
    assert rules(check_dockerfile(text)) == {"XR010"}


def test_empty_dockerfile_is_reported() -> None:
    assert rules(check_dockerfile("# vazio\n")) == {"XR001"}


# ---------- Bicep ----------

BICEP_TEXT = BICEP.read_text(encoding="utf-8")


def bicep(text: str) -> list[Finding]:
    return check_bicep(text, KNOWN_ENV)


def test_bicep_baseline_is_clean() -> None:
    assert bicep(BICEP_TEXT) == []


def test_xr004_typo_in_env_name() -> None:
    text = BICEP_TEXT.replace("'AZURE_OPENAI_DEPLOYMENT'", "'AZURE_OPENAI_DEPLOYMET'")
    found = [f for f in bicep(text) if f.rule == "XR004"]
    assert len(found) == 1 and "DEPLOYMET" in found[0].message


def test_xr003_literal_for_secret_named_env() -> None:
    text = BICEP_TEXT.replace(
        "{ name: 'OTEL_SERVICE_NAME', value: 'llm-service' }",
        "{ name: 'OTEL_SERVICE_NAME', value: 'llm-service' }\n  { name: 'PARTNER_API_KEY', value: 'abc' }",
    )
    assert "XR003" in rules(bicep(text))


def test_xr003_secretref_for_secret_named_env_is_fine() -> None:
    assert "XR003" not in rules(bicep(BICEP_TEXT))  # PARTNER_API_KEY usa secretRef no baseline


def test_xr003_credential_shaped_literal_anywhere() -> None:
    text = BICEP_TEXT + "\nvar leak = 'AccountKey=" + "A" * 30 + "'\n"
    assert "XR003" in rules(bicep(text))


def test_secret_in_comment_is_ignored() -> None:
    text = BICEP_TEXT + "\n// ghp_" + "a" * 36 + "\n"
    assert bicep(text) == []


def test_xr005_missing_wrong_and_ok_probes() -> None:
    wrong = BICEP_TEXT.replace("path: '/readyz'", "path: '/ready'")
    assert any("Readiness" in f.message for f in bicep(wrong) if f.rule == "XR005")
    no_live = BICEP_TEXT.replace("type: 'Liveness'", "type: 'Startup'")
    assert any("Liveness" in f.message and "ausente" in f.message for f in bicep(no_live))


def test_xr008_latest_in_bicep() -> None:
    text = BICEP_TEXT.replace("param image string = ''", "param image string = 'acr.io/app:latest'")
    assert "XR008" in rules(bicep(text))


def test_xr009_no_identity_list_keys_and_local_auth() -> None:
    no_identity = BICEP_TEXT.replace("type: 'UserAssigned'", "type: 'None'")
    assert "XR009" in rules(bicep(no_identity))
    keys = BICEP_TEXT + "\nvar k = oai.listKeys().key1\n"
    assert "XR009" in rules(bicep(keys))
    local_auth = BICEP_TEXT.replace("disableLocalAuth: true", "disableLocalAuth: false")
    assert "XR009" in rules(bicep(local_auth))


def test_bicep_without_container_app_does_not_demand_probes() -> None:
    assert bicep("resource x 'Microsoft.KeyVault/vaults@2023-07-01' = {\n  name: 'a'\n}\n") == []


# ---------- Workflow ----------

WF_TEXT = WORKFLOW.read_text(encoding="utf-8")


def wf(text: str) -> list[Finding]:
    return check_workflow(text)


def test_workflow_baseline_is_clean() -> None:
    assert wf(WF_TEXT) == []


def test_xr006_missing_id_token_write() -> None:
    text = WF_TEXT.replace("      id-token: write\n", "      id-token: none\n")
    assert "XR006" in rules(wf(text))


def test_xr006_id_token_only_read_at_top_level_is_not_enough() -> None:
    text = WF_TEXT.replace("    permissions:\n      id-token: write\n      contents: read\n", "")
    assert "XR006" in rules(wf(text))


def test_xr006_creds_json_or_client_secret_instead_of_oidc() -> None:
    legacy = WF_TEXT.replace(
        "          client-id: ${{ vars.AZURE_CLIENT_ID }}",
        "          creds: ${{ secrets.AZURE_CREDENTIALS }}\n          client-id: ${{ vars.AZURE_CLIENT_ID }}",
    )
    assert any("creds" in f.message for f in wf(legacy) if f.rule == "XR006")
    missing = WF_TEXT.replace("          tenant-id: ${{ vars.AZURE_TENANT_ID }}\n", "")
    assert any("tenant-id" in f.message for f in wf(missing))


def test_xr006_no_login_step_at_all() -> None:
    text = "on: push\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo\n"
    assert "XR006" in rules(wf(text))


@pytest.mark.parametrize("ref", ["@main", "@master", ""])
def test_xr007_floating_action_ref(ref: str) -> None:
    text = WF_TEXT.replace("actions/checkout@v4", f"actions/checkout{ref}", 1)
    assert "XR007" in rules(wf(text))


def test_xr003_literal_secret_in_step_env() -> None:
    text = WF_TEXT.replace(
        "      - name: Build e push com tag imutável\n        run: |",
        "      - name: Build e push com tag imutável\n        env:\n          PARTNER_API_KEY: hunter2\n        run: |",
    )
    assert "XR003" in rules(wf(text))


def test_xr003_secret_from_context_is_fine() -> None:
    text = WF_TEXT.replace(
        "      - name: Build e push com tag imutável\n        run: |",
        "      - name: Build e push com tag imutável\n        env:\n          PARTNER_API_KEY: ${{ secrets.PARTNER }}\n        run: |",
    )
    assert wf(text) == []


def test_xr008_latest_tag_in_pipeline() -> None:
    text = WF_TEXT.replace('llm-service:$SHA" .', 'llm-service:latest" .')
    assert "XR008" in rules(wf(text))


def test_xr012_write_all() -> None:
    text = WF_TEXT.replace("permissions:\n  contents: read\n", "permissions: write-all\n", 1)
    assert "XR012" in rules(wf(text))


def test_invalid_yaml_and_missing_jobs() -> None:
    assert rules(wf("a: [unclosed")) == {"XR000"}
    assert rules(wf("name: x\n")) == {"XR000"}


# ---------- runner e CLI ----------


def test_missing_file_is_reported_not_raised(tmp_path: Path) -> None:
    findings = check_files(known_env=KNOWN_ENV, dockerfile=tmp_path / "nope")
    assert rules(findings) == {"XR000"}


def test_cli_fails_on_error_and_emits_json(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    bad = tmp_path / "Dockerfile"
    bad.write_text("FROM python:latest\n", encoding="utf-8")
    code = main(["--json", "--dockerfile", str(bad)])
    data = json.loads(capsys.readouterr().out)
    assert code == 1
    assert {"XR001", "XR002", "XR010"} == {d["rule"] for d in data}


def test_cli_warning_only_passes_unless_strict(tmp_path: Path) -> None:
    f = tmp_path / "Dockerfile"
    f.write_text(GOOD_DOCKER.replace("HEALTHCHECK CMD true\n", ""), encoding="utf-8")
    assert main(["--dockerfile", str(f)]) == 0
    assert main(["--strict", "--dockerfile", str(f)]) == 1


def test_cli_requires_at_least_one_input() -> None:
    with pytest.raises(SystemExit) as err:
        main([])
    assert err.value.code == 2


def test_each_floating_action_reports_its_own_line() -> None:
    text = WF_TEXT.replace("actions/checkout@v4", "actions/checkout@main")
    lines = sorted(f.line for f in wf(text) if f.rule == "XR007")
    assert len(lines) == 2 and lines[0] != lines[1]
    source = text.splitlines()
    assert all("checkout@main" in source[n - 1] for n in lines)
