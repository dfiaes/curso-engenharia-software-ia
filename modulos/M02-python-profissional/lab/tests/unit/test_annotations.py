from python_senior_lab.annotations_demo import describe_annotations


def test_deferred_annotation_is_inspected_without_resolving_missing_name() -> None:
    def later(value: object) -> object:
        return value

    later.__annotations__ = {
        "value": "NotImportedAtRuntime",
        "return": "NotImportedAtRuntime",
    }
    annotations = describe_annotations(later)

    assert annotations == {
        "value": "NotImportedAtRuntime",
        "return": "NotImportedAtRuntime",
    }
