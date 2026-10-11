"""Errors raised for bad user input. The CLI maps them to exit code 2."""

from __future__ import annotations


class InputError(ValueError):
    """The input file or argument is invalid; the message says where and why."""
