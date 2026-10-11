from __future__ import annotations

from collections.abc import Iterator

import pytest

from web_http_lab.api import LabServer, running_server


@pytest.fixture
def server() -> Iterator[LabServer]:
    with running_server() as srv:
        yield srv
