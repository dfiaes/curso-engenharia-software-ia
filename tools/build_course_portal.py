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
EXPECTED_UNITS = 19
EXPECTED_BLOCKS = 152


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


def build_manifest() -> dict[str, Any]:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    units: list[dict[str, Any]] = []
    seen_codes: set[str] = set()
    seen_block_ids: set[str] = set()

    for configured in source["units"]:
        unit = dict(configured)
        code = unit["code"]
        if code in seen_codes:
            raise ValueError(f"duplicate unit code: {code}")
        if code.startswith("ML"):
            raise ValueError(f"optional ML unit cannot enter the core portal: {code}")
        seen_codes.add(code)

        content_files = unit.pop("contentFiles", [unit["file"]])
        parsed_by_file: list[tuple[str, list[dict[str, str]]]] = []
        for relative in content_files:
            path = ROOT / relative
            if not path.is_file():
                raise ValueError(f"missing unit file: {relative}")
            parsed_by_file.append((relative, headings(path)))

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
        main_headings = parsed_by_file[0][1]
        unit["blocks"] = ordered
        unit["optional"] = {
            "labAnchor": optional_anchor(main_headings, "Laboratório guiado"),
            "checkpointAnchor": optional_anchor(main_headings, "Checkpoint"),
        }
        units.append(unit)

    total_blocks = sum(len(unit["blocks"]) for unit in units)
    if len(units) != EXPECTED_UNITS:
        raise ValueError(f"expected {EXPECTED_UNITS} units, found {len(units)}")
    if total_blocks != EXPECTED_BLOCKS:
        counts = ", ".join(f"{unit['code']}={len(unit['blocks'])}" for unit in units)
        raise ValueError(f"expected {EXPECTED_BLOCKS} blocks, found {total_blocks}: {counts}")

    known = {unit["code"] for unit in units}
    for unit in units:
        missing = set(unit["prerequisites"]) - known
        if missing:
            raise ValueError(f"{unit['code']}: unknown prerequisites {sorted(missing)}")

    return {
        "schemaVersion": 1,
        "courseVersion": source["version"],
        "title": source["title"],
        "totalUnits": len(units),
        "totalBlocks": total_blocks,
        "units": units,
    }


def render(manifest: dict[str, Any]) -> str:
    template = TEMPLATE.read_text(encoding="utf-8")
    payload = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("</", "<\/")
    marker = "__COURSE_MANIFEST__"
    if template.count(marker) != 1:
        raise ValueError("portal template must contain exactly one manifest marker")
    return template.replace(marker, payload)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate generated files without rewriting")
    args = parser.parse_args()
    manifest = build_manifest()
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

    print(
        f"Portal manifest: {manifest['totalUnits']} units / "
        f"{manifest['totalBlocks']} blocks; {'valid' if args.check else 'generated'}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
