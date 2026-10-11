#!/usr/bin/env python3
"""Build and validate the static course portal from the module HTML headings."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "portal" / "course-source.json"
MANIFEST = ROOT / "portal" / "course-manifest.json"
TEMPLATE = ROOT / "portal" / "index.template.html"
OUTPUT = ROOT / "index.html"
WRITING = "em escrita"
AVAILABLE = "disponível"


class HeadingParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._heading: dict[str, Any] | None = None
        self.headings: list[dict[str, str]] = []
        self._section_ids: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag == "section":
            self._section_ids.append(values.get("id", ""))
        if tag in {"h1", "h2"}:
            inherited = next((item for item in reversed(self._section_ids) if item), "")
            self._heading = {"tag": tag, "id": values.get("id", "") or inherited, "text": []}

    def handle_data(self, data: str) -> None:
        if self._heading is not None:
            self._heading["text"].append(data)

    def handle_endtag(self, tag: str) -> None:
        if self._heading is not None and self._heading["tag"] == tag:
            self.headings.append(
                {
                    "tag": tag,
                    "id": self._heading["id"],
                    "text": " ".join("".join(self._heading["text"]).split()),
                }
            )
            self._heading = None
        if tag == "section" and self._section_ids:
            self._section_ids.pop()


def headings(path: Path) -> list[dict[str, str]]:
    parser = HeadingParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.headings


def block_number(title: str) -> int | None:
    match = re.match(r"^(?:Bloco|B)\s*0?(\d+)\b", title, flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def optional_anchor(items: list[dict[str, str]], term: str) -> str | None:
    for item in items:
        if term.casefold() in item["text"].casefold() and item["id"]:
            return item["id"]
    return None


def build_manifest(allow_missing: bool = False) -> dict[str, Any]:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    units: list[dict[str, Any]] = []
    seen_codes: set[str] = set()
    seen_block_ids: set[str] = set()
    phase_order: list[str] = []

    for configured in source["units"]:
        unit = dict(configured)
        code = unit["code"]
        if code in seen_codes:
            raise ValueError(f"duplicate unit code: {code}")
        seen_codes.add(code)
        if not isinstance(unit.get("hours"), (int, float)) or unit["hours"] <= 0:
            raise ValueError(f"{code}: hours must be a positive number")
        phase = unit["phase"]
        if phase not in phase_order:
            phase_order.append(phase)
        elif phase_order[-1] != phase:
            raise ValueError(f"{code}: phase {phase!r} is not contiguous")

        content_files = unit.pop("contentFiles", [unit["file"]])
        missing = [relative for relative in content_files if not (ROOT / relative).is_file()]
        if missing and not allow_missing:
            raise ValueError(f"missing unit file: {missing[0]}")

        parsed_by_file: list[tuple[str, list[dict[str, str]]]] = []
        if not missing:
            for relative in content_files:
                parsed_by_file.append((relative, headings(ROOT / relative)))

        blocks_by_number: dict[int, dict[str, str]] = {}
        for relative, items in parsed_by_file:
            for item in items:
                number = block_number(item["text"])
                if number is None:
                    continue
                if not item["id"]:
                    raise ValueError(f"{relative}: block {number} has no anchor")
                block_id = f"{code}:b{number:02d}"
                if block_id in seen_block_ids or number in blocks_by_number:
                    raise ValueError(f"duplicate block: {block_id}")
                seen_block_ids.add(block_id)
                blocks_by_number[number] = {
                    "id": block_id,
                    "number": number,
                    "anchor": item["id"],
                    "title": item["text"],
                    "file": relative,
                }

        ordered = [blocks_by_number[number] for number in sorted(blocks_by_number)]
        if not ordered and not allow_missing:
            raise ValueError(f"{code}: no 'Bloco N' headings found in {content_files[0]}")
        main_headings = parsed_by_file[0][1] if parsed_by_file else []
        unit["blocks"] = ordered
        unit["optional"] = {
            "labAnchor": optional_anchor(main_headings, "Laboratório guiado"),
            "checkpointAnchor": optional_anchor(main_headings, "Checkpoint"),
        }
        unit["status"] = AVAILABLE if ordered else WRITING
        units.append(unit)

    position = {unit["code"]: index for index, unit in enumerate(units)}
    for index, unit in enumerate(units):
        for prerequisite in unit["prerequisites"]:
            if prerequisite not in position:
                raise ValueError(f"{unit['code']}: unknown prerequisites {[prerequisite]}")
            if position[prerequisite] >= index:
                raise ValueError(f"{unit['code']}: prerequisite {prerequisite} must come earlier in the curriculum")

    return {
        "schemaVersion": 2,
        "courseVersion": source["version"],
        "title": source["title"],
        "totalUnits": len(units),
        "availableUnits": sum(1 for unit in units if unit["status"] == AVAILABLE),
        "totalBlocks": sum(len(unit["blocks"]) for unit in units),
        "totalHours": sum(unit["hours"] for unit in units),
        "phases": [
            {"name": name, "units": [unit["code"] for unit in units if unit["phase"] == name]}
            for name in phase_order
        ],
        "units": units,
    }


def render(manifest: dict[str, Any]) -> str:
    rendered = TEMPLATE.read_text(encoding="utf-8")
    marker = "__COURSE_MANIFEST__"
    if rendered.count(marker) != 1:
        raise ValueError(f"portal template must contain exactly one {marker} marker")
    payload = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
    return rendered.replace(marker, payload.replace("</", "<\\/"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate generated files without rewriting")
    parser.add_argument(
        "--allow-missing",
        action="store_true",
        help="list units whose file does not exist yet as 'em escrita' with no blocks",
    )
    args = parser.parse_args()
    manifest = build_manifest(allow_missing=args.allow_missing)
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    output_text = render(manifest)

    if args.check:
        errors: list[str] = []
        if not MANIFEST.is_file() or MANIFEST.read_text(encoding="utf-8") != manifest_text:
            errors.append("portal/course-manifest.json is stale; run tools/build_course_portal.py")
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != output_text:
            errors.append("index.html is stale; run tools/build_course_portal.py")
        if errors:
            print("\n".join(errors))
            return 1
    else:
        MANIFEST.write_text(manifest_text, encoding="utf-8")
        OUTPUT.write_text(output_text, encoding="utf-8")

    writing = [unit["code"] for unit in manifest["units"] if unit["status"] == WRITING]
    print(
        f"Portal manifest: {manifest['totalUnits']} units "
        f"({manifest['availableUnits']} available) / {manifest['totalBlocks']} blocks; "
        f"{'valid' if args.check else 'generated'}."
    )
    if writing:
        print(f"Em escrita ({len(writing)}): {', '.join(writing)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
