# 2026 camp placement drop — RESTRICTED

**Do not publish before gates open (2026-08-30).** These files live in the *private*
repo (`iBurnApp/iBurn-Data-Private`, remote `origin`) only. Never push this directory,
or anything derived from it that exposes camp locations, to the `public` remote
(`iBurnApp/iBurn-Data`) before the embargo lifts.

## Provenance

Received **2026-08-09** from Andrew Lowe via the `bman-innovators-map-access` channel,
produced with [brcMapTools](https://github.com/jspolsky/brcMapTools). The camp polygons
were traced/OCR'd from the official **2026 Public Camp Map PDF** (included here), then
georeferenced against the golden spike.

## Files

| File | Contents |
| --- | --- |
| `2026_BRC_Public_Map.pdf` | Source PDF the geometry was traced from (9.5 MB). |
| `campsgeocoded.json` | 1191 camp records with `location.centroid` (GeoJSON Point, `[lon, lat]`); no polygons. |
| `campsgeocodedwithborders.json` | Same 1191 records plus `location.border` (GeoJSON Polygon). **This is the file the pipeline consumes.** |
| `corrections.json` | brcMapTools calibration + manual audit trail (see below). Provenance only — already baked into the two geocoded files. |

`campsgeocoded.json` is a strict subset of `campsgeocodedwithborders.json` and is kept
only for provenance; nothing in the pipeline reads it.

### Coverage

* 1191 records; `uid` matches `../APIData/APIData.bundle/camp.json` exactly (same 1191 uids, no extras on either side).
* 1170 have both `centroid` and `border`; **21 have neither** (camps the map does not draw — mobile/airport/support camps and a few unplaced). These degrade gracefully: no outline, no label, GPS falls back to the address geocode.

### `corrections.json`

Calibration constants (golden spike at pixel `[2174.98, 2486.83]` = `40.783242, -119.207871`,
map scale `0.35814710758352436` units/foot) plus the human audit trail: 18 `redraw_polygon`
fixes and 258 `name_override` label corrections. Spot-checked 240/258 `name_override`
values against camp names present in the geocoded output (e.g. `The Melon Motel`,
`D'JUNGLE`, `The G Spot`, `Golden Gate Project`), confirming the corrections are already
applied upstream. **Nothing re-applies them here** — treat this file as documentation.

## Consuming the drop

```sh
node scripts/apply_placement.js --year 2026
```

See `scripts/apply_placement.js` for the merge policy (fill-only against the API) and the
generated outputs (`camp.json` GPS backfill, `Map.bundle/camp_outlines.geojson`,
`Map.bundle/camp_labels.geojson`). The script is idempotent.

## Note on the 2026 BMorg API

As of the **2026-08-09** refresh the official API serves full placement itself
(`location_string`, `location.{frontage,intersection,intersection_type,dimensions,exact_location}`)
for all 1191 camps, and every one of those fields matches this drop byte-for-byte. The
drop's unique contribution is therefore the **geometry**: per-camp polygons and centroids,
which the API does not provide.
