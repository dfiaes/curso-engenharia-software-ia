"""``bands.yaml``: which breach gets which response tier."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from sdlc_kit.anomaly import MIN_LOOKBACK, RULE_SIGMA, Breach

ACTIONS = ("log", "diagnose_readonly", "propose")


class BandsError(ValueError):
    """Invalid bands.yaml."""


@dataclass(frozen=True, slots=True)
class Tier:
    name: str
    sigma: int
    action: str
    via: str = ""
    runbook: str = ""


@dataclass(frozen=True, slots=True)
class Bands:
    metric: str
    window: int
    lookback: int
    min_std: float
    rules: tuple[str, ...]
    tiers: tuple[Tier, ...]

    def tier_for(self, breach: Breach) -> Tier | None:
        """Highest tier whose sigma does not exceed the breach's sigma."""
        eligible = [t for t in self.tiers if t.sigma <= breach.sigma]
        return eligible[-1] if eligible else None


def _tier(raw: Any, previous: int) -> Tier:
    if not isinstance(raw, dict):
        raise BandsError("each tier must be a mapping")
    name, sigma, action = raw.get("name"), raw.get("sigma"), raw.get("action")
    if not isinstance(name, str) or not name:
        raise BandsError("tier without name")
    if not isinstance(sigma, int) or isinstance(sigma, bool) or sigma <= previous:
        raise BandsError(f"tier '{name}': sigma must be an integer greater than the previous tier")
    if action not in ACTIONS:
        raise BandsError(f"tier '{name}': action must be one of {ACTIONS}")
    via = str(raw.get("via", ""))
    runbook = str(raw.get("runbook", ""))
    if action == "propose":
        if via not in {"pr", "runbook"}:
            raise BandsError(f"tier '{name}': 'propose' needs via: pr | runbook")
        if via == "runbook" and not runbook:
            raise BandsError(f"tier '{name}': via runbook needs a pre-approved runbook name")
    return Tier(name, sigma, str(action), via, runbook)


def parse_bands(text: str) -> Bands:
    data = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise BandsError("bands.yaml must be a mapping")
    metric = data.get("metric")
    if not isinstance(metric, str) or not metric:
        raise BandsError("metric is required")
    window = data.get("window", 30)
    lookback = data.get("lookback", MIN_LOOKBACK)
    if not isinstance(window, int) or window < 10:
        raise BandsError("window must be an integer >= 10")
    if not isinstance(lookback, int) or lookback < MIN_LOOKBACK:
        raise BandsError(f"lookback must be an integer >= {MIN_LOOKBACK}")
    rules = tuple(data.get("rules", RULE_SIGMA))
    if not rules or set(rules) - set(RULE_SIGMA):
        raise BandsError(f"rules must be a non-empty subset of {sorted(RULE_SIGMA)}")
    raw_tiers = data.get("tiers")
    if not isinstance(raw_tiers, list) or not raw_tiers:
        raise BandsError("tiers is required")
    tiers: list[Tier] = []
    previous = 0
    for raw in raw_tiers:
        tier = _tier(raw, previous)
        tiers.append(tier)
        previous = tier.sigma
    return Bands(metric, window, lookback, float(data.get("min_std", 0.0)), rules, tuple(tiers))


def load_bands(path: Path) -> Bands:
    return parse_bands(path.read_text(encoding="utf-8"))
