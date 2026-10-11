from __future__ import annotations

import asyncio
import threading
from collections.abc import Coroutine
from typing import Any

from python_senior_lab.local_server import DisposableLocalServer, StarvationDiagnostic


def run[T](coroutine: Coroutine[Any, Any, T]) -> T:
    return asyncio.run(coroutine)


def test_heartbeat_distinguishes_blocking_from_cooperative_wait() -> None:
    async def scenario() -> None:
        async with DisposableLocalServer() as server:
            loop = asyncio.get_running_loop()
            blocking_heartbeat = threading.Event()
            blocking_observations: list[bool] = []

            def observe_blocked_loop() -> None:
                server.blocking_started.wait()
                loop.call_soon_threadsafe(blocking_heartbeat.set)
                # O callback não pode rodar: o próprio loop está preso no handler.
                blocking_observations.append(blocking_heartbeat.is_set())
                server.release_blocking()

            observer = threading.Thread(
                target=observe_blocked_loop,
                name="blocking-loop-observer",
                daemon=True,
            )
            observer.start()
            blocking_response = await server.request("/blocking")
            while not blocking_heartbeat.is_set():
                await asyncio.sleep(0)
            observer.join(timeout=1)
            assert not observer.is_alive()

            cooperative_heartbeat = asyncio.Event()
            cooperative_request = asyncio.create_task(server.request("/cooperative"))
            await server.cooperative_started.wait()
            loop.call_soon(cooperative_heartbeat.set)
            await cooperative_heartbeat.wait()
            cooperative_progressed_while_waiting = not cooperative_request.done()
            server.release_cooperative()
            cooperative_response = await cooperative_request

            diagnostic = StarvationDiagnostic(
                blocking_heartbeat_while_waiting=blocking_observations[0],
                cooperative_heartbeat_while_waiting=cooperative_progressed_while_waiting,
            )

            assert server.host == "127.0.0.1"
            assert server.port > 0
            assert blocking_response.status_code == 200
            assert blocking_response.body == b"blocking released"
            assert cooperative_response.status_code == 200
            assert cooperative_response.body == b"cooperative released"
            assert blocking_heartbeat.is_set()
            assert diagnostic.blocking_heartbeat_while_waiting is False
            assert diagnostic.cooperative_heartbeat_while_waiting is True
            assert diagnostic.starvation_observed is True

    run(asyncio.wait_for(scenario(), timeout=5))
