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
STUDY_ROUTE_SOURCE = ROOT / "portal" / "study-route-source.json"
MANIFEST = ROOT / "portal" / "course-manifest.json"
STUDY_ROUTE_MANIFEST = ROOT / "portal" / "study-route-manifest.json"
TEMPLATE = ROOT / "portal" / "index.template.html"
OUTPUT = ROOT / "index.html"
EXPECTED_UNITS = 19
EXPECTED_BLOCKS = 152
EXPECTED_STUDY_STAGES = 10


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


def build_study_route_manifest(course_manifest: dict[str, Any] | None = None) -> dict[str, Any]:
    route = json.loads(STUDY_ROUTE_SOURCE.read_text(encoding="utf-8"))
    manifest = course_manifest or build_manifest()
    known_units = {unit["code"] for unit in manifest["units"]}
    if not isinstance(route.get("version"), str) or not route["version"].strip():
        raise ValueError("curated route needs a version")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", route.get("curatedAt", "")):
        raise ValueError("curated route needs an ISO curation date")
    stages = route.get("stages")
    if not isinstance(stages, list) or len(stages) != EXPECTED_STUDY_STAGES:
        raise ValueError(f"expected {EXPECTED_STUDY_STAGES} curated stages")

    seen_ids: set[str] = set()
    for stage in stages:
        stage_id = stage.get("id", "")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", stage_id) or stage_id in seen_ids:
            raise ValueError(f"invalid or duplicate curated stage id: {stage_id!r}")
        seen_ids.add(stage_id)
        for field in ("title", "summary", "synthesis", "outcome"):
            if not isinstance(stage.get(field), str) or not stage[field].strip():
                raise ValueError(f"{stage_id}: missing {field}")
        resources = stage.get("resources")
        if not isinstance(resources, list) or not resources:
            raise ValueError(f"{stage_id}: resources are required")
        if not any(resource.get("role") == "essential" for resource in resources):
            raise ValueError(f"{stage_id}: at least one essential resource is required")
        local_references = stage.get("localReferences", [])
        if not isinstance(local_references, list):
            raise ValueError(f"{stage_id}: local references must be a list")
        for resource in resources:
            for field in ("title", "organization", "scope", "url", "type", "role"):
                if not isinstance(resource.get(field), str) or not resource[field].strip():
                    raise ValueError(f"{stage_id}: resource missing {field}")
            if not re.fullmatch(r"https://[^\s]+", resource["url"]):
                raise ValueError(f"{stage_id}: resource URL must use HTTPS: {resource['url']}")
            if resource["role"] not in {"essential", "deepening"}:
                raise ValueError(f"{stage_id}: invalid resource role {resource['role']}")
        for code in local_references:
            if code not in known_units:
                raise ValueError(f"{stage_id}: unknown local reference {code}")
            if code == "M11":
                raise ValueError("M11 is optional and cannot appear in the core study route")

    optional_tracks = route.get("optionalTracks")
    if not isinstance(optional_tracks, list) or not optional_tracks:
        raise ValueError("optional tracks must remain discoverable")
    for item in optional_tracks:
        for field in ("id", "title", "summary"):
            if not isinstance(item.get(field), str) or not item[field].strip():
                raise ValueError(f"optional track missing {field}")
        if item.get("unitCode") and item["unitCode"] not in known_units:
            raise ValueError(f"unknown optional unit: {item['unitCode']}")
        if not item.get("unitCode") and not item.get("url"):
            raise ValueError(f"optional track needs a unitCode or local URL: {item['id']}")
        if item.get("url"):
            local_path = item["url"].split("#", 1)[0]
            target = (ROOT / local_path).resolve()
            if Path(local_path).is_absolute() or ".." in Path(local_path).parts or not target.is_relative_to(ROOT) or not target.is_file():
                raise ValueError(f"optional resource must be an existing repository-relative file: {item['url']}")

    return route


def render(manifest: dict[str, Any], route_manifest: dict[str, Any] | None = None) -> str:
    template = TEMPLATE.read_text(encoding="utf-8")
    route_manifest = route_manifest or build_study_route_manifest(manifest)
    payloads = {
        "__COURSE_MANIFEST__": manifest,
        "__STUDY_ROUTE_MANIFEST__": route_manifest,
    }
    rendered = template
    for marker, data in payloads.items():
        if rendered.count(marker) != 1:
            raise ValueError(f"portal template must contain exactly one {marker} marker")
        payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        rendered = rendered.replace(marker, payload.replace("</", "<\\/"))
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate generated files without rewriting")
    args = parser.parse_args()
    manifest = build_manifest()
    route_manifest = build_study_route_manifest(manifest)
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    route_manifest_text = json.dumps(route_manifest, ensure_ascii=False, indent=2) + "\n"
    output_text = render(manifest, route_manifest)

    if args.check:
        errors: list[str] = []
        if not MANIFEST.is_file() or MANIFEST.read_text(encoding="utf-8") != manifest_text:
            errors.append("portal/course-manifest.json is stale; run tools/build_course_portal.py")
        if not STUDY_ROUTE_MANIFEST.is_file() or STUDY_ROUTE_MANIFEST.read_text(encoding="utf-8") != route_manifest_text:
            errors.append("portal/study-route-manifest.json is stale; run tools/build_course_portal.py")
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != output_text:
            errors.append("index.html is stale; run tools/build_course_portal.py")
        if errors:
            print("\n".join(errors))
            return 1
    else:
        MANIFEST.write_text(manifest_text, encoding="utf-8")
        STUDY_ROUTE_MANIFEST.write_text(route_manifest_text, encoding="utf-8")
        OUTPUT.write_text(output_text, encoding="utf-8")

    print(
        f"Portal manifest: {manifest['totalUnits']} units / "
        f"{manifest['totalBlocks']} blocks; {len(route_manifest['stages'])} curated stages; "
        f"{'valid' if args.check else 'generated'}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
