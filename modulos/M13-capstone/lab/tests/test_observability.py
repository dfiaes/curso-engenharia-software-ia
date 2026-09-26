"""B14: traces com parentesco, métricas reais, log sanitizado e SLO/burn rate."""

import pytest

from capstone_lab.observability import (
    Metrics,
    Tracer,
    burn_rate,
    error_rate,
    sanitize_log,
    slo_alert,
)


def test_trace_parent_child_mesmo_trace_id() -> None:
    tracer = Tracer()
    root = tracer.start("ingest")
    child = tracer.start("parse", parent=root, file="a.py")
    tracer.end(child)
    tracer.end(root)
    s_child, s_root = tracer.spans
    assert s_child.trace_id == s_root.trace_id
    assert s_child.parent_id == s_root.span_id and s_root.parent_id is None
    assert s_child.duration_ms is not None and s_child.duration_ms >= 0.0
    assert s_root.duration_ms is not None
    assert s_root.duration_ms >= s_child.duration_ms  # filho dentro do pai


def test_metricas_contador_e_percentil_real() -> None:
    m = Metrics()
    m.inc("requests")
    m.inc("requests")
    assert m.counters["requests"] == 2
    for v in (10.0, 20.0, 30.0, 40.0, 50.0):
        m.observe("latency_ms", v)
    assert m.percentile("latency_ms", 50) == 30.0
    assert m.percentile("latency_ms", 95) == 50.0
    with pytest.raises(ValueError):
        m.percentile("vazia", 95)


def test_log_sanitizado_remove_pii_e_segredo() -> None:
    record = {
        "msg": "job falhou para maria.silva@example.com com token=abc123",
        "user_email": "maria.silva@example.com",
        "api_key": "sk-supersecret123",
        "path": "src/main.py",
    }
    clean = sanitize_log(record)
    assert clean["user_email"] == "[REDACTED]" and clean["api_key"] == "[REDACTED]"
    assert "maria.silva@example.com" not in clean["msg"] and "abc123" not in clean["msg"]
    assert clean["path"] == "src/main.py"  # dado não sensível preservado


def test_slo_matematica_exata() -> None:
    events = [True] * 99 + [False]  # 1% de erro em 100 eventos
    assert error_rate(events) == 0.01
    assert burn_rate(events, 0.99) == pytest.approx(1.0)  # exatamente no budget
    with pytest.raises(ValueError):
        error_rate([])
    with pytest.raises(ValueError):
        burn_rate(events, 1.0)


def test_failure_injection_dispara_alerta_correto() -> None:
    healthy = [True] * 999 + [False]  # 0.1% de erro: dentro do SLO 99%
    assert slo_alert(healthy, 0.99) is None
    injected = [True] * 90 + [False] * 10  # falha injetada: 10% de erro
    alert = slo_alert(injected, 0.99)
    assert alert is not None and alert.startswith("ALERTA fast-burn")


def test_alerta_derivado_do_numero_nao_de_flag() -> None:
    events = [True] * 95 + [False] * 5
    # nenhum campo "alert": True existe na entrada; o alerta vem do cálculo
    alert = slo_alert(events, 0.99)
    assert alert is not None and f"{burn_rate(events, 0.99):.2f}x" in alert
