"""deploycheck: verificador estático de prontidão de deploy (Dockerfile, Bicep, workflow)."""

from deploycheck.model import Finding, Severity
from deploycheck.runner import check_files

__all__ = ["Finding", "Severity", "check_files"]
