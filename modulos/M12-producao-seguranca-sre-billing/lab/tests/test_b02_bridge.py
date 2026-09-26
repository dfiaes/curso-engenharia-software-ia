"""M12-B02-L: executable bridge for M12-AT-002/003/004 (local slice, no network).

Limits (not executed here): real DNS/egress boundary, encoded-payload
defense beyond high-confidence patterns, real Capstone exporter, PG/E2E.
"""

import base64
from pathlib import Path
from uuid import uuid4

import pytest

from m12_lab.authorization import ActionRisk, LocalPolicy
from m12_lab.models import Principal, ToolRequest
from m12_lab.runtime import (
    ExportReportArguments,
    RuntimeDenied,
    SafeAgentRuntime,
    SessionAuthority,
    ToolSchemaRegistry,
)
from m12_lab.security import ContentPolicy, SecurityViolation, ToolConstraints
from m12_lab.telemetry import SafeSpanExporter


def test_at002_denies_symlink_escape_before_io(
    tmp_path: Path, tmp_path_factory: pytest.TempPathFactory
) -> None:
    workspace = tmp_path / "ws"
    workspace.mkdir()
    outside = tmp_path_factory.mktemp("outside")
    secret = outside / "secret.txt"
    secret.write_text("fake-secret", encoding="utf-8")
    (workspace / "escape").symlink_to(outside, target_is_directory=True)
    policy = ToolConstraints(workspace, frozenset({"api.example.test"}))

    with pytest.raises(SecurityViolation, match="SEC_PATH_OUTSIDE_WORKSPACE"):
        policy.safe_path(Path("escape") / "secret.txt")


@pytest.mark.parametrize(
    "url, code",
    [
        ("https://user:pass@api.example.test/v1", "SEC_URL_INVALID"),
        ("http://api.example.test/v1", "SEC_URL_INVALID"),
        ("https://other.example.test/v1", "SEC_HOST_NOT_ALLOWED"),
        ("https://10.0.0.1/admin", "SEC_SSRF_ADDRESS"),
        ("https://0.0.0.0/admin", "SEC_SSRF_ADDRESS"),
        ("https://224.0.0.1/admin", "SEC_SSRF_ADDRESS"),
        ("https://[::1]/admin", "SEC_SSRF_ADDRESS"),
        ("https://[::]/admin", "SEC_SSRF_ADDRESS"),
        ("https://[fe80::1]/admin", "SEC_SSRF_ADDRESS"),
        ("not-a-url", "SEC_URL_INVALID"),
    ],
)
def test_at002_denies_ssrf_variants_without_network(tmp_path: Path, url: str, code: str) -> None:
    policy = ToolConstraints(tmp_path, frozenset({"api.example.test"}))

    with pytest.raises(SecurityViolation, match=code):
        policy.safe_url(url)


def test_at003_redacts_private_key_with_marker(tmp_path: Path) -> None:
    _ = tmp_path
    raw = "-----BEGIN PRIVATE KEY-----\nfake-body\n-----END PRIVATE KEY-----"

    result = ContentPolicy().redact(raw)

    assert "BEGIN PRIVATE KEY" not in result.text
    assert result.text == "[REDACTED:private_key]\nfake-body\n-----END PRIVATE KEY-----"
    assert result.categories == frozenset({"private_key"})


def test_at003_encoded_payload_passes_redactor_and_stays_a_declared_limit() -> None:
    encoded = base64.b64encode(b"owner@example.com").decode("ascii")

    result = ContentPolicy().redact(encoded)

    assert result.categories == frozenset()
    assert result.text == encoded


def test_at003_exporter_drops_non_allowlist_and_marks_redacted() -> None:
    exporter = SafeSpanExporter(ContentPolicy())

    span = exporter.export(
        "ai.operation",
        {
            "ai.operation.name": "report for owner@example.com",
            "prompt": "owner@example.com",
            "security.policy_rule": "AUTH_ALLOW_SCOPED",
        },
    )

    assert "prompt" not in span.attributes
    assert "owner@example.com" not in repr(span.attributes)
    assert span.attributes["security.outcome"] == "redacted"


def test_at004_rejects_unregistered_tool_before_effect() -> None:
    tenant_id = uuid4()
    runtime = SafeAgentRuntime(ToolSchemaRegistry(), LocalPolicy())
    principal = Principal(
        actor_id=uuid4(),
        tenant_id=tenant_id,
        scopes=frozenset({"tools:export_report"}),
        workload_id="agent-runtime",
    )
    session = SessionAuthority(tenant_id=tenant_id, allowed_tools=frozenset({"unknown_tool"}))
    proposal = ToolRequest(
        tenant_id=tenant_id,
        tool_name="unknown_tool",
        arguments={"report_id": str(uuid4()), "format": "json"},
    )

    with pytest.raises(RuntimeDenied, match="TOOL_NOT_REGISTERED"):
        runtime.evaluate_proposal(
            principal,
            session,
            proposal,
            ActionRisk.REVERSIBLE_WRITE,
            untrusted_content="evidence only",
        )
    assert runtime.audit_events == []


def test_at004_rejects_extra_argument_enum_and_missing_field() -> None:
    registry = ToolSchemaRegistry()
    registry.register("export_report", ExportReportArguments)
    tenant_id = uuid4()
    bad_sets = [
        {"report_id": str(uuid4()), "format": "docx"},
        {"report_id": str(uuid4()), "format": "pdf", "extra": "x"},
        {"format": "pdf"},
    ]

    for arguments in bad_sets:
        with pytest.raises(RuntimeDenied, match="TOOL_ARGUMENTS_INVALID"):
            registry.validate(
                ToolRequest(
                    tenant_id=tenant_id,
                    tool_name="export_report",
                    arguments=arguments,
                )
            )
