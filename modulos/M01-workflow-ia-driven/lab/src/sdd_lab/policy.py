"""Política mínima para workflows externos tratados como supply chain."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass


@dataclass(frozen=True)
class WorkflowReview:
    sha256: str
    allowed_commands: frozenset[str]


@dataclass(frozen=True)
class WorkflowDecision:
    allowed: bool
    reason: str


def review_fingerprint(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def authorize_external_workflow(
    content: bytes,
    requested_command: str | None,
    review: WorkflowReview | None,
) -> WorkflowDecision:
    if requested_command is None:
        return WorkflowDecision(True, "declarative_step")
    if review is None:
        return WorkflowDecision(False, "external_process_requires_review")
    if review.sha256 != review_fingerprint(content):
        return WorkflowDecision(False, "content_changed_after_review")
    if requested_command not in review.allowed_commands:
        return WorkflowDecision(False, "command_not_allowlisted")
    return WorkflowDecision(True, "reviewed_exact_content")
