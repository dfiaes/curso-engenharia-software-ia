"""B7: grafo com proveniência, update incremental, travessias e corpus dourado."""

from pathlib import Path

import pytest

from capstone_lab.graph import CodeGraph
from capstone_lab.parsers import ParseResult, Relation

GOLDEN = Path(__file__).parent.parent / "fixtures" / "golden" / "graph-b07.golden.json"


def source_a() -> ParseResult:
    r = ParseResult(language="python", path="a.py")
    r.relations = [
        Relation("imports", "a.py", "json", 1),
        Relation("calls", "a.py", "helper", 4),
    ]
    return r


def source_b() -> ParseResult:
    r = ParseResult(language="python", path="b.py")
    r.relations = [
        Relation("imports", "b.py", "json", 5),
        Relation("calls", "b.py", "helper", 7),
    ]
    return r


def test_structural_question_who_calls_helper() -> None:
    g = CodeGraph()
    g.add_file(source_a())
    g.add_file(source_b())
    callers = g.callers_of("helper")
    # resposta estrutural que a busca textual isolada não dá:
    assert [(e.src, e.provenance.line) for e in callers] == [("a.py", 4), ("b.py", 7)]


def test_every_edge_has_provenance() -> None:
    g = CodeGraph()
    g.add_file(source_a())
    g.add_file(source_b())
    g.add_inferred("helper", "logger", "calls_inferred", "a.py", 4)
    assert g.without_provenance() == []  # nenhuma aresta sem origem


def test_facts_are_separated_from_inference() -> None:
    g = CodeGraph()
    g.add_file(source_a())
    g.add_file(source_b())
    g.add_inferred("helper", "logger", "calls_inferred", "a.py", 4)
    assert g.facts_vs_inferred() == {"extracted": 4, "inferred": 1}


def test_incremental_update_replaces_only_changed_file() -> None:
    g = CodeGraph()
    g.add_file(source_a())
    g.add_file(source_b())
    changed = ParseResult(language="python", path="a.py")
    changed.relations = [Relation("calls", "a.py", "helper", 9)]  # nova linha, sem import
    g.add_file(changed)
    assert [(e.src, e.provenance.line) for e in g.callers_of("helper")] == [
        ("a.py", 9),
        ("b.py", 7),
    ]
    assert len(g.imports_of("a.py")) == 0  # aresta antiga de a.py substituída
    assert len(g.imports_of("b.py")) == 1  # b.py intacto (não duplicado)


def test_graph_metrics_in_degree() -> None:
    g = CodeGraph()
    g.add_file(source_a())
    g.add_file(source_b())
    assert g.in_degree("helper") == 2
    assert dict(g.top_by_in_degree(2)) == {"helper": 2, "json": 2}


def test_answers_match_golden_corpus() -> None:
    g = CodeGraph()
    g.add_file(source_a())
    g.add_file(source_b())
    g.add_inferred("helper", "logger", "calls_inferred", "a.py", 4)
    assert g.golden_diff(GOLDEN) == []


def test_golden_mutation_is_detected(tmp_path: Path) -> None:
    g = CodeGraph()
    g.add_file(source_a())
    g.add_file(source_b())
    broken = tmp_path / "broken.golden.json"
    broken.write_text(
        GOLDEN.read_text(encoding="utf-8").replace('"extracted": 4', '"extracted": 99'),
        encoding="utf-8",
    )
    assert g.golden_diff(broken) != []


def test_inferred_edge_requires_explicit_source_label() -> None:
    g = CodeGraph()
    g.add_inferred("x", "y", "speculation", "a.py", 1)
    sources = {e.provenance.source for e in g._edges}
    assert sources == {"inferred"}


def test_empty_graph_has_no_callers() -> None:
    assert CodeGraph().callers_of("helper") == []
    with pytest.raises(KeyError):
        CodeGraph().facts_vs_inferred()["unexpected_key"]
