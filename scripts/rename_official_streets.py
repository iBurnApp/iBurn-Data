#!/usr/bin/env python3
"""Rewrite official street_lines.geojson letter names to the year's themed names.

BMorg's official `street_lines.geojson` only carries letter names (A, B, ... K,
ESP). The MapLibre style labels streets via `{name}`, so the letters have to be
rewritten to the real themed names before tiling, using the letter->name mapping
in `layouts/layout.json` `cStreets`. Radial clock streets (H:MM), Rods Road and
Route 66 already carry real names and are left alone.

Usage (from the repo root):

    python3 scripts/rename_official_streets.py \
      data/2026/layouts/layout.json \
      bmorg/innovate-GIS-data/2026/GeoJSON/street_lines.geojson \
      "$TMPDIR/street_lines_named_2026.geojson"

then pass the output as the `streets` layer to tippecanoe. See CLAUDE.md
"Vector Tile Generation" for the full command.
"""
import json
import sys
from collections import Counter


def main():
    if len(sys.argv) != 4:
        sys.exit(f"usage: {sys.argv[0]} <layout.json> <street_lines.geojson> <out.geojson>")
    layout_path, streets_path, out_path = sys.argv[1:4]

    with open(layout_path) as f:
        layout = json.load(f)
    mapping = {}
    for street in layout["cStreets"]:
        ref = street["ref"]
        key = "ESP" if ref == "esplanade" else ref.upper()
        mapping[key] = street["name"]

    with open(streets_path) as f:
        streets = json.load(f)

    renamed = Counter()
    for feature in streets["features"]:
        name = feature["properties"].get("name")
        if name in mapping:
            feature["properties"]["name"] = mapping[name]
            renamed[f"{name} -> {mapping[name]}"] += 1

    with open(out_path, "w") as f:
        json.dump(streets, f)

    print(f"renamed {sum(renamed.values())} of {len(streets['features'])} features")
    for key, count in sorted(renamed.items()):
        print(f"  {key}: {count}")


if __name__ == "__main__":
    main()
