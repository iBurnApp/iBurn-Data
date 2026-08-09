# 2026 camp placement data — RESTRICTED

**Do not publish before gates open (2026-08-30).** These files live in the *private*
repo (`iBurnApp/iBurn-Data-Private`, remote `origin`) only. Never push this directory,
or anything derived from it that exposes camp locations, to the `public` remote
(`iBurnApp/iBurn-Data`) before the embargo lifts.

## Provenance

Two restricted geometry sources, both received **2026-08-09**:

* **`public_camps.geojson`** — a direct GeoJSON export of the current camp placement
  polygons. It supersedes the PDF-derived outlines below: it comes straight from the
  placement data rather than from a picture of it, and it corrects a handful of camps
  the extraction had traced into the wrong block. It is not a perfect superset —
  ~8 camps in the API have no polygon here.
* **`campsgeocodedwithborders.json`** (plus `campsgeocoded.json`, `corrections.json`,
  `2026_BRC_Public_Map.pdf`) — an OCR-derived extraction of the 2026 public camp map
  PDF, georeferenced against the golden spike. Still the source of per-camp centroids,
  and the fallback outline for any camp the direct export omits.

## Files

| File | Contents |
| --- | --- |
| `public_camps.geojson` | 1183 Polygon features, `properties: {FID, UID, Name}` where `UID` matches `camp.json`'s `uid`. **Preferred outline source.** |
| `2026_BRC_Public_Map.pdf` | Source PDF the extracted geometry was traced from (9.5 MB). |
| `campsgeocoded.json` | 1191 camp records with `location.centroid` (GeoJSON Point, `[lon, lat]`); no polygons. |
| `campsgeocodedwithborders.json` | Same 1191 records plus `location.border` (GeoJSON Polygon). **Centroid source, and the fallback outline source.** |
| `corrections.json` | Extraction calibration + manual audit trail (see below). Provenance only — already baked into the two geocoded files. |

`campsgeocoded.json` is a strict subset of `campsgeocodedwithborders.json` and is kept
only for provenance; nothing in the pipeline reads it.

### Coverage

Counted against the 1191 camps in `../APIData/APIData.bundle/camp.json`:

| | Camps |
| --- | --- |
| Polygon in both sources | 1170 |
| Polygon in the direct export only | 13 |
| Polygon in the PDF extraction only | 0 |
| No polygon in either | 8 |

* Every `UID` in `public_camps.geojson` exists in `camp.json`, and every `Name` matches
  `camp.json`'s name exactly. So does every `uid` in the PDF extraction (same 1191 uids,
  no extras on either side).
* So the shipped map draws **1183 camps**; the remaining 8 (mobile/support camps and a
  few unplaced) degrade gracefully — no outline, no label, GPS falls back to the
  address geocode.
* Where the two sources disagree they mostly agree to ~2 m. Seven camps move more than
  50 m, up to 2 km, and in every one of those cases the direct export lands *closer* to
  the camp's own address geocode — i.e. it fixes tracing errors, it does not introduce
  them.

### `corrections.json`

Calibration constants (golden spike at pixel `[2174.98, 2486.83]` = `40.783242, -119.207871`,
map scale `0.35814710758352436` units/foot) plus the human audit trail: 18 `redraw_polygon`
fixes and 258 `name_override` label corrections. Spot-checked 240/258 `name_override`
values against camp names present in the geocoded output (e.g. `The Melon Motel`,
`D'JUNGLE`, `The G Spot`, `Golden Gate Project`), confirming the corrections are already
applied upstream. **Nothing re-applies them here** — treat this file as documentation.

## Consuming the data

```sh
node scripts/apply_placement.js --year 2026
```

See `scripts/apply_placement.js` for the merge policy (fill-only against the API) and the
generated outputs (`camp.json` GPS, `Map.bundle/camp_outlines.geojson`,
`Map.bundle/camp_labels.geojson`). Outlines prefer `public_camps.geojson` and fall back
to the extracted borders; each label sits at the area-weighted centroid of the polygon
actually shipped. The script is idempotent.

**Camp GPS is that same centroid.** The app's pin for a camp is written from the very
value its label is drawn at, so the two can never disagree. The alternative — the offline
address geocoder — resolves to street intersections, which gave 1184 placed camps only 365
distinct coordinates and left the app fanning co-located pins around a circle; centroids
give all 1184 a coordinate of their own. `--gps-source geocoder|entrance` still exist for
comparison runs. Camps with no polygon (8) keep their address geocode, or have no GPS at
all if the geocoder could not place them either (7).

**Where this should end up:** the pin a burner actually wants is the middle of the camp's
street frontage, on the road side — you walk up to a camp from the street, whereas an area
centroid can sit deep inside a large lot. The PDF extraction's entrance centroids
approximate that, but a handful are hundreds of metres out, so they are not trustworthy
enough to default to. Deriving frontage from the shipped polygons plus the street grid
would supersede both.

## Note on the 2026 BMorg API

As of the **2026-08-09** refresh the official API serves full placement itself
(`location_string`, `location.{frontage,intersection,intersection_type,dimensions,exact_location}`)
for all 1191 camps, and every one of those fields matches the PDF extraction
byte-for-byte. These files' unique contribution is therefore the **geometry**: per-camp
polygons and centroids, which the API does not provide.
