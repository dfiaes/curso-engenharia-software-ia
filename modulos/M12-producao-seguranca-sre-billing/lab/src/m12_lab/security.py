"""Deterministic controls for untrusted content and tool boundaries."""

from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit


class SecurityViolation(ValueError):
    """Raised before an unsafe external effect occurs."""


@dataclass(frozen=True, slots=True)
class RedactionResult:
    text: str
    categories: frozenset[str]


class ContentPolicy:
    """Redacts high-confidence patterns; it is defense in depth, not authorization."""

    _rules: tuple[tuple[str, re.Pattern[str]], ...] = (
        ("email", re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")),
        ("aws_key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
        ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
        ("connection_string", re.compile(r"(?i)(?:postgres(?:ql)?|mongodb|redis)://[^\s]+")),
    )

    def redact(self, text: str) -> RedactionResult:
        categories: set[str] = set()
        redacted = text
        for category, pattern in self._rules:
            if pattern.search(redacted):
                categories.add(category)
                redacted = pattern.sub(f"[REDACTED:{category}]", redacted)
        return RedactionResult(redacted, frozenset(categories))


class ToolConstraints:
    """Canonicalizes destinations and fails closed before file/network I/O."""

    def __init__(self, workspace: Path, allowed_hosts: frozenset[str]) -> None:
        self._workspace = workspace.resolve(strict=True)
        self._allowed_hosts = allowed_hosts

    def safe_path(self, candidate: Path) -> Path:
        resolved = (self._workspace / candidate).resolve(strict=False)
        if not resolved.is_relative_to(self._workspace):
            raise SecurityViolation("SEC_PATH_OUTSIDE_WORKSPACE")
        return resolved

    def safe_url(self, raw_url: str) -> str:
        parsed = urlsplit(raw_url)
        if parsed.scheme != "https" or parsed.username or parsed.password or not parsed.hostname:
            raise SecurityViolation("SEC_URL_INVALID")
        host = parsed.hostname.rstrip(".").lower()
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            address = None
        if address is not None and (
            address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_reserved
            or address.is_multicast
            or address.is_unspecified
        ):
            raise SecurityViolation("SEC_SSRF_ADDRESS")
        if host not in self._allowed_hosts:
            raise SecurityViolation("SEC_HOST_NOT_ALLOWED")
        return parsed.geturl()
