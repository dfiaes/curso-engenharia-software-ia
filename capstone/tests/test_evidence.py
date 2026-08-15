from cartografo.evidence import CheckResult, Decision, evaluate_checks


def check(evidence_id: str, exit_code: int | None) -> CheckResult:
    return CheckResult(
        evidence_id=evidence_id,
        command="uv run pytest",
        exit_code=exit_code,
        blocker="Docker unavailable" if exit_code is None else None,
    )


def test_pass_is_derived_only_when_every_required_command_succeeds() -> None:
    result = evaluate_checks((check("EV-REP-001", 0), check("EV-API-001", 0)))

    assert result is Decision.PASS


def test_failure_has_priority_over_blocked() -> None:
    result = evaluate_checks((check("EV-REP-001", 1), check("EV-DAT-001", None)))

    assert result is Decision.FAIL


def test_missing_execution_is_blocked_not_passed() -> None:
    result = evaluate_checks((check("EV-DAT-001", None),))

    assert result is Decision.BLOCKED
