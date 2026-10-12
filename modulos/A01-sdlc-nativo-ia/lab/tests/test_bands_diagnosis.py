from __future__ import annotations

import pytest

from sdlc_kit.anomaly import Breach, scan
from sdlc_kit.artifacts import parse_document, validate_intent
from sdlc_kit.bands import Bands, BandsError, load_bands, parse_bands
from sdlc_kit.demo import synthetic_series
from sdlc_kit.diagnosis import diagnosis_intent
from tests.conftest import EXAMPLES

BANDS = load_bands(EXAMPLES / "bands.yaml")

TWO_EQUAL = "metric: m\ntiers: [{name: a, sigma: 2, action: log}, {name: b, sigma: 2, action: log}]"

MINIMAL = """
metric: m
tiers:
  - {name: log, sigma: 1, action: log}
"""


def breach(rule: str, sigma: int) -> Breach:
    return Breach(rule, sigma, 50, "high", 3.2)


def test_example_bands_load() -> None:
    assert BANDS.metric == "http_5xx_per_min"
    assert [t.name for t in BANDS.tiers] == ["log", "diagnose", "act"]
    assert BANDS.tiers[2].runbook == "rollback-last-deploy"


def test_defaults_when_optional_keys_are_missing() -> None:
    b = parse_bands(MINIMAL)
    assert (b.window, b.lookback, b.min_std) == (30, 8, 0.0)
    assert b.rules == ("WE1", "WE2", "WE3", "WE4")


@pytest.mark.parametrize(
    ("snippet", "message"),
    [
        ("tiers: []", "metric is required"),
        ("metric: m", "tiers is required"),
        ("metric: m\nwindow: 3\ntiers: [{name: a, sigma: 1, action: log}]", "window"),
        ("metric: m\nlookback: 4\ntiers: [{name: a, sigma: 1, action: log}]", "lookback"),
        ("metric: m\nrules: [WE9]\ntiers: [{name: a, sigma: 1, action: log}]", "rules"),
        (TWO_EQUAL, "greater"),
        ("metric: m\ntiers: [{name: a, sigma: 1, action: page_everyone}]", "action"),
        ("metric: m\ntiers: [{name: a, sigma: 3, action: propose}]", "via"),
        ("metric: m\ntiers: [{name: a, sigma: 3, action: propose, via: runbook}]", "runbook"),
        ("- just a list", "mapping"),
        ("metric: m\ntiers: [oops]", "mapping"),
    ],
)
def test_invalid_bands_are_rejected(snippet: str, message: str) -> None:
    with pytest.raises(BandsError, match=message):
        parse_bands(snippet)


def test_tier_for_maps_sigma_to_the_highest_eligible_tier() -> None:
    assert BANDS.tier_for(breach("WE4", 1)) is not None
    assert BANDS.tier_for(breach("WE4", 1)).name == "log"  # type: ignore[union-attr]
    assert BANDS.tier_for(breach("WE2", 2)).name == "diagnose"  # type: ignore[union-attr]
    assert BANDS.tier_for(breach("WE1", 3)).name == "act"  # type: ignore[union-attr]


def test_tier_for_returns_none_below_the_first_tier() -> None:
    b = parse_bands("metric: m\ntiers: [{name: d, sigma: 2, action: diagnose_readonly}]")
    assert b.tier_for(breach("WE4", 1)) is None


def _intent_for(bands: Bands, kind: str, rule: str) -> tuple[str | None, str]:
    series = synthetic_series(kind)
    chosen = next(
        b for b in scan(series, bands.window, bands.lookback, bands.min_std) if b.rule == rule
    )
    tier = bands.tier_for(chosen)
    assert tier is not None
    return diagnosis_intent(
        "INT-900", bands, chosen, tier, series[-8:], "2026-10-11T12:00:00Z"
    ), tier.name


def test_log_tier_produces_no_intent() -> None:
    text, tier = _intent_for(BANDS, "drift", "WE4")
    assert tier == "log" and text is None


def test_diagnose_tier_intent_is_valid_draft_and_read_only() -> None:
    text, tier = _intent_for(BANDS, "step", "WE2")
    assert tier == "diagnose" and text is not None
    doc = parse_document(text)
    assert validate_intent(doc) == []
    assert doc.meta["status"] == "draft" and doc.meta["origin"] == "monitor"
    assert "somente leitura" in text


def test_act_tier_with_runbook_names_it_and_still_requires_a_human() -> None:
    text, _ = _intent_for(BANDS, "spike", "WE1")
    assert text is not None and "rollback-last-deploy" in text and "humano autoriza" in text
    assert validate_intent(parse_document(text)) == []


def test_act_tier_via_pr_does_not_mention_a_runbook() -> None:
    bands = parse_bands(
        "metric: m\nmin_std: 0.5\ntiers: [{name: act, sigma: 3, action: propose, via: pr}]"
    )
    text, _ = _intent_for(bands, "spike", "WE1")
    assert text is not None and "PR" in text and "runbook" not in text
