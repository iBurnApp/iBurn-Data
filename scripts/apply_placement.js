#!/usr/bin/env node
// Merge the restricted camp placement data into the shipping data bundles.
//
// There are two restricted inputs, both in `data/<year>/placement/` (see that
// directory's README for provenance and the embargo rules):
//
//   - `public_camps.geojson` — a direct GeoJSON export of the current camp placement
//     polygons. Features carry `{FID, UID, Name}`; `UID` matches `camp.json`'s `uid`.
//     This is the preferred, higher-fidelity source of camp footprints.
//   - `campsgeocodedwithborders.json` — the older PDF-derived extraction, keyed by the
//     same `uid`, whose records carry two things the BMorg API does not serve:
//       - `location.centroid` — GeoJSON Point, the camp's position on the map
//       - `location.border`   — GeoJSON Polygon, the camp's drawn footprint
//     It remains the source of centroids, and the fallback for camps the direct
//     export omits.
//
// This script:
//
//   1. Backfills `camp.json` placement fields from the PDF-derived drop, FILL-ONLY: a
//      value the API already supplied is never overwritten. Where the API and the drop
//      disagree the API wins and the conflict is logged. (In the 2026-08-09 data every
//      textual field agrees, so this only ever fills genuine holes.)
//   2. Sets `location.gps_latitude`/`gps_longitude` — the camp's map pin. See
//      --gps-source below; by default the pin is the centroid of the camp's own
//      footprint, which is exactly the point its map label is drawn at.
//   3. Bumps `update.json`'s `camps.updated` so the app re-imports over any older seed
//      — but only when camp.json actually changed, which keeps re-runs no-ops.
//   4. Regenerates `Map.bundle/camp_outlines.geojson` (Polygon features) and
//      `Map.bundle/camp_labels.geojson` (Point features), both carrying
//      `properties: {uid, name}` so the map can label and identify each camp. Each
//      label sits at the area-weighted centroid of the polygon actually shipped for
//      that camp, falling back to the drop's entrance centroid when no polygon exists.
//      Names always come from `camp.json`, so the map agrees with the app's text.
//
// GPS sources (--gps-source, default `auto`):
//
//   auto      polygon centroid -> address geocode -> entrance centroid.
//             The polygon centroid is the *same* value written to camp_labels.geojson
//             for that camp — literally the same array, so the pin and the map label
//             can never drift apart. Camps with no footprint keep whatever
//             `fetch_and_geocode.js` placed them at, and only camps with neither fall
//             back to the drop's entrance guess.
//   geocoder  address geocode -> entrance centroid. What the app shipped before
//             footprints existed: a point on the nearest street intersection, so every
//             camp on a corner lands on the same coordinate as its neighbours and the
//             app has to fan the pins out around a circle to make them tappable.
//   entrance  entrance centroid -> address geocode. The PDF-derived drop's guess at
//             where the camp faces the street.
//
// FUTURE (not implemented): the pin we actually want is the middle of the camp's
// street frontage, on the road side of the footprint — that is where a burner walks up
// to the camp, whereas the area centroid can sit deep inside a large lot. The
// `entrance` source approximates this, but the PDF-derived guesses are not yet
// trustworthy enough to default to (a handful sit hundreds of metres out). Deriving
// frontage from the shipped polygons plus the street grid would supersede both.
//
// Note that `geocoder` and `entrance` read whatever GPS `camp.json` currently holds, so
// running them after `auto` compares against the previous run's output, not against the
// geocoder. Reset with `git checkout` (or re-run `fetch_and_geocode.js`) first.
//
// The script is idempotent: running it twice yields byte-identical files.
//
// Usage (from Submodules/iBurn-Data):
//   node scripts/apply_placement.js [--year 2026]
//                                   [--gps-source auto|geocoder|entrance]
//                                   [--dry-run] [--verbose]
//
// Paths can be overridden individually with --placement / --polygons / --camps /
// --update / --outlines / --labels. `--polygons none` ignores the direct export and
// builds outlines from the PDF-derived borders alone.

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

if (flag('--help') || flag('-h')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n')
    .filter((l) => l.startsWith('//')).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

const year = opt('--year', '2026');
const dryRun = flag('--dry-run');
const verbose = flag('--verbose');
const GPS_SOURCES = {
  auto: 'polygon centroid (address geocode, then entrance centroid, as fallbacks)',
  geocoder: 'address geocode (entrance centroid as fallback)',
  entrance: 'entrance centroid (address geocode as fallback)'
};
const gpsSource = opt('--gps-source', 'auto');
if (!Object.prototype.hasOwnProperty.call(GPS_SOURCES, gpsSource)) {
  console.error(`Error: --gps-source must be one of ${Object.keys(GPS_SOURCES).join(', ')} (got "${gpsSource}")`);
  process.exit(1);
}

const dataRoot = path.join(__dirname, '..', 'data');
const bundleDir = path.join(dataRoot, year, 'APIData', 'APIData.bundle');
const mapBundleDir = path.join(dataRoot, year, 'Map', 'Map.bundle');

const placementPath = opt('--placement', path.join(dataRoot, year, 'placement', 'campsgeocodedwithborders.json'));
const polygonsPath = opt('--polygons', path.join(dataRoot, year, 'placement', 'public_camps.geojson'));
const campsPath = opt('--camps', path.join(bundleDir, 'camp.json'));
const updatePath = opt('--update', path.join(bundleDir, 'update.json'));
const outlinesPath = opt('--outlines', path.join(mapBundleDir, 'camp_outlines.geojson'));
const labelsPath = opt('--labels', path.join(mapBundleDir, 'camp_labels.geojson'));

// Black Rock City, generously padded. Anything outside is a tracing error, not a camp.
const BBOX = { minLon: -119.35, maxLon: -119.1, minLat: 40.75, maxLat: 40.82 };
// ~0.11 m at this latitude; far finer than a traced polygon warrants, and it keeps the
// bundled geojson roughly a third the size of the raw drop.
const COORD_PRECISION = 6;

// Placement fields copied from the drop into camp.location, in camp.json's own order.
const LOCATION_FIELDS = ['frontage', 'intersection', 'intersection_type', 'dimensions', 'exact_location'];

function loadJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`Error: could not read ${p}: ${e.message}`);
    process.exit(1);
  }
}

// `trailingNewline` keeps each file byte-compatible with whatever already writes it:
// fetch_and_geocode.js emits the APIData bundle without one, the geojson has one.
function serialize(obj, trailingNewline) {
  return JSON.stringify(obj, null, 2) + (trailingNewline ? '\n' : '');
}

function saveJSON(p, obj, trailingNewline) {
  if (dryRun) return;
  const tmp = `${p}.tmp`;
  fs.writeFileSync(tmp, serialize(obj, trailingNewline));
  fs.renameSync(tmp, p);
}

function isEmpty(v) { return v === null || v === undefined || v === ''; }

function round(n) { return Number(n.toFixed(COORD_PRECISION)); }

function inBBox(lon, lat) {
  return typeof lon === 'number' && typeof lat === 'number'
    && lon >= BBOX.minLon && lon <= BBOX.maxLon
    && lat >= BBOX.minLat && lat <= BBOX.maxLat;
}

// Matches fetch_and_geocode.js: strict ISO-8601 in Pacific time with no fractional
// seconds. Burning Man is always PDT, so the offset is hard-coded like it is there.
function pacificTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}-07:00`;
}

/** Centroid as [lon, lat], rounded and bbox-checked; null if absent or implausible. */
function centroidOf(record, warnings) {
  const c = (record.location || {}).centroid;
  if (!c || c.type !== 'Point' || !Array.isArray(c.coordinates)) return null;
  const [lon, lat] = c.coordinates;
  if (!inBBox(lon, lat)) {
    warnings.push(`${record.name}: centroid outside Black Rock City [${lon}, ${lat}]`);
    return null;
  }
  return [round(lon), round(lat)];
}

/** Polygon rings, rounded, closed and bbox-checked; null if absent or implausible. */
function ringsOf(polygon, label, warnings) {
  if (!polygon || polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) return null;
  const rings = [];
  for (const ring of polygon.coordinates) {
    if (!Array.isArray(ring) || ring.length < 4) {
      warnings.push(`${label}: polygon ring has ${Array.isArray(ring) ? ring.length : 0} points, skipping`);
      return null;
    }
    const out = [];
    for (const [lon, lat] of ring) {
      if (!inBBox(lon, lat)) {
        warnings.push(`${label}: polygon vertex outside Black Rock City [${lon}, ${lat}], skipping`);
        return null;
      }
      out.push([round(lon), round(lat)]);
    }
    // GeoJSON requires an explicitly closed ring; rounding can also break a ring that
    // was closed only to full float precision.
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) out.push([first[0], first[1]]);
    rings.push(out);
  }
  return rings.length ? rings : null;
}

function borderOf(record, warnings) {
  return ringsOf((record.location || {}).border, record.name, warnings);
}

/**
 * Area-weighted centroid of a polygon (the centre of mass of its interior), as
 * [lon, lat] rounded like every other coordinate here.
 *
 * This is the shoelace centroid, not the mean of the vertices: a camp footprint with
 * many vertices bunched along one edge would drag a vertex average off toward that
 * edge, while this stays put. Rings are summed with their signed areas, so a hole
 * (wound opposite its shell) subtracts itself out.
 *
 * Coordinates are used in degrees, shifted to a local origin first. The shift is not
 * cosmetic: a camp footprint spans ~1e-3 degrees while lon/lat sit near 119 and 41, so
 * the shoelace cross products are ~1e10 times the signed area they are meant to sum to
 * and double precision cancels away every meaningful digit. Working relative to the
 * first vertex keeps the terms the size of the answer. Translation and the
 * degrees-vs-metres scaling are both affine, and a centroid commutes with affine maps,
 * so this is exactly the answer a locally-projected computation would give mapped back
 * — the flat-earth approximation costs nothing over a ~100 m footprint.
 *
 * Degenerate rings (zero enclosed area — a collapsed or self-cancelling footprint)
 * have no centre of mass; those fall back to the mean of the distinct vertices.
 */
function polygonCentroid(rings) {
  const [ox, oy] = rings[0][0];
  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const x0 = ring[i][0] - ox;
      const y0 = ring[i][1] - oy;
      const x1 = ring[i + 1][0] - ox;
      const y1 = ring[i + 1][1] - oy;
      const cross = (x0 * y1) - (x1 * y0);
      area2 += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
  }
  if (area2 !== 0) return [round(ox + (cx / (3 * area2))), round(oy + (cy / (3 * area2)))];

  let n = 0;
  let sx = 0;
  let sy = 0;
  for (const ring of rings) {
    // ring is closed, so the last point repeats the first.
    for (let i = 0; i < ring.length - 1; i++) {
      sx += ring[i][0];
      sy += ring[i][1];
      n++;
    }
  }
  return n ? [round(sx / n), round(sy / n)] : null;
}

/**
 * Metres between two [lon, lat] points, equirectangular. Over the few hundred metres a
 * pin can move inside Black Rock City the error against a great-circle distance is far
 * below the precision anyone reads these numbers at.
 */
function metresBetween(a, b) {
  const M_PER_DEG_LAT = 111320;
  const meanLat = ((a[1] + b[1]) / 2) * Math.PI / 180;
  const dx = (a[0] - b[0]) * M_PER_DEG_LAT * Math.cos(meanLat);
  const dy = (a[1] - b[1]) * M_PER_DEG_LAT;
  return Math.sqrt((dx * dx) + (dy * dy));
}

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + ((sorted[hi] - sorted[lo]) * (i - lo));
}

/** uid -> rings, from the direct placement export. Empty when it is absent/disabled. */
function loadDirectPolygons(warnings) {
  if (polygonsPath === 'none') return new Map();
  if (!fs.existsSync(polygonsPath)) {
    warnings.push(`${polygonsPath} not found; outlines fall back to the PDF-derived borders`);
    return new Map();
  }
  const fc = loadJSON(polygonsPath);
  const features = (fc && Array.isArray(fc.features)) ? fc.features : null;
  if (!features) {
    console.error(`Error: ${polygonsPath} is not a GeoJSON FeatureCollection`);
    process.exit(1);
  }
  const byUid = new Map();
  for (const feature of features) {
    const props = feature.properties || {};
    const uid = props.UID || props.uid;
    if (!uid) {
      warnings.push('direct polygon feature with no UID, skipping');
      continue;
    }
    if (byUid.has(uid)) warnings.push(`duplicate polygon uid ${uid} (${props.Name || props.name}) in the direct export`);
    const rings = ringsOf(feature.geometry, props.Name || props.name || uid, warnings);
    if (rings) byUid.set(uid, rings);
  }
  return byUid;
}

function featureCollection(features) {
  return { type: 'FeatureCollection', features };
}

/**
 * How many camps a map user could actually tell apart by pin position. The address
 * geocoder resolves to street intersections, so hundreds of camps share a coordinate
 * and the app has to fan co-located pins onto a circle; footprint centroids are
 * per-camp, so this number should land just under the count of placed camps.
 */
function distinctGpsCount(camps) {
  const seen = new Set();
  for (const camp of camps) {
    const l = camp.location || {};
    if (isEmpty(l.gps_latitude) || isEmpty(l.gps_longitude)) continue;
    seen.add(`${l.gps_latitude},${l.gps_longitude}`);
  }
  return seen.size;
}

function main() {
  const placement = loadJSON(placementPath);
  const camps = loadJSON(campsPath);
  if (!Array.isArray(placement) || !Array.isArray(camps)) {
    console.error('Error: expected both placement and camp.json to be JSON arrays');
    process.exit(1);
  }

  const warnings = [];
  const directPolygons = loadDirectPolygons(warnings);
  const distinctGpsBefore = distinctGpsCount(camps);

  console.log(`Applying ${year} placement`);
  console.log(`  placement: ${placementPath} (${placement.length} records)`);
  console.log(`  polygons:  ${polygonsPath === 'none' ? '(disabled)' : `${polygonsPath} (${directPolygons.size} polygons)`}`);
  console.log(`  camps:     ${campsPath} (${camps.length} camps)`);
  console.log(`  gps source: ${gpsSource} — ${GPS_SOURCES[gpsSource]}`);
  if (dryRun) console.log('  (dry run — no files written)');

  const byUid = new Map();
  for (const record of placement) {
    if (byUid.has(record.uid)) console.warn(`Warning: duplicate placement uid ${record.uid} (${record.name})`);
    byUid.set(record.uid, record);
  }

  const conflicts = [];
  const stats = {
    matched: 0, unmatchedCamps: 0, filledFields: 0, filledGps: 0,
    replacedGps: 0, noGps: 0, outlines: 0, labels: 0, noGeometry: 0,
    directOutlines: 0, fallbackOutlines: 0, polygonLabels: 0, centroidLabels: 0,
    gpsFromPolygon: 0, gpsFromGeocoder: 0, gpsFromEntrance: 0
  };
  const movements = [];

  // Driven off camp.json so a camp the API dropped can never leak back in through the
  // map layers, and so feature order is stable across runs.
  const outlineFeatures = [];
  const labelFeatures = [];

  for (const camp of camps) {
    const record = byUid.get(camp.uid) || null;
    // Outlines prefer the direct export; the PDF-derived border only covers for uids
    // the export omits. Labels then follow whichever polygon actually ships.
    const directRings = directPolygons.get(camp.uid) || null;

    if (!record) {
      stats.unmatchedCamps++;
      if (verbose) console.log(`  no placement record for ${camp.name} (${camp.uid})`);
    } else {
      stats.matched++;

      if (isEmpty(camp.location_string) && !isEmpty(record.location_string)) {
        camp.location_string = record.location_string;
        stats.filledFields++;
      } else if (!isEmpty(camp.location_string) && !isEmpty(record.location_string)
                 && camp.location_string !== record.location_string) {
        conflicts.push(`${camp.name}: location_string API "${camp.location_string}" vs drop "${record.location_string}" (kept API)`);
      }

      const src = record.location || {};
      if (!camp.location) camp.location = {};
      for (const field of LOCATION_FIELDS) {
        if (isEmpty(src[field])) continue;
        if (isEmpty(camp.location[field])) {
          camp.location[field] = src[field];
          stats.filledFields++;
        } else if (camp.location[field] !== src[field]) {
          conflicts.push(`${camp.name}: location.${field} API "${camp.location[field]}" vs drop "${src[field]}" (kept API)`);
        }
      }
    }

    const entrance = record ? centroidOf(record, warnings) : null;
    const border = record ? borderOf(record, warnings) : null;
    const outline = directRings || border;

    const properties = { uid: camp.uid, name: camp.name };
    if (outline) {
      if (directRings) stats.directOutlines++; else stats.fallbackOutlines++;
      outlineFeatures.push({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: outline } });
    }
    // Anchor the label in the middle of the footprint that ships, so the name sits on
    // the camp the map draws. Only camps with no polygon at all fall back to the
    // drop's entrance centroid.
    const polygonAnchor = outline ? polygonCentroid(outline) : null;
    const anchor = polygonAnchor || entrance;
    if (anchor) {
      if (polygonAnchor) stats.polygonLabels++; else stats.centroidLabels++;
      labelFeatures.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: anchor } });
    } else {
      stats.noGeometry++;
    }

    // GPS. `polygonAnchor` is the very array written into camp_labels.geojson above, so
    // under the default source the pin and the label are the same point by construction
    // — no parallel computation to drift, no rounding to re-derive.
    const existing = camp.location
      && !isEmpty(camp.location.gps_latitude) && !isEmpty(camp.location.gps_longitude)
      ? [camp.location.gps_longitude, camp.location.gps_latitude]
      : null;
    const ordered = gpsSource === 'geocoder' ? [[existing, 'geocoder'], [entrance, 'entrance']]
      : gpsSource === 'entrance' ? [[entrance, 'entrance'], [existing, 'geocoder']]
        : [[polygonAnchor, 'polygon'], [existing, 'geocoder'], [entrance, 'entrance']];
    const picked = ordered.find(([point]) => point) || null;

    if (picked) {
      const [gps, from] = picked;
      if (from === 'polygon') stats.gpsFromPolygon++;
      else if (from === 'geocoder') stats.gpsFromGeocoder++;
      else stats.gpsFromEntrance++;
      if (!camp.location) camp.location = {};
      // camp.json orders gps after the address fields; assigning in place keeps that.
      const changed = camp.location.gps_latitude !== gps[1] || camp.location.gps_longitude !== gps[0];
      camp.location.gps_latitude = gps[1];
      camp.location.gps_longitude = gps[0];
      if (changed) {
        if (existing) {
          stats.replacedGps++;
          movements.push(metresBetween(existing, gps));
        } else {
          stats.filledGps++;
        }
      }
    } else {
      stats.noGps++;
      if (verbose) console.log(`  no GPS for ${camp.name} (no polygon, no geocode, no entrance centroid)`);
    }

    // An empty location object is noise; camps with nothing placed shouldn't grow one.
    if (camp.location && Object.keys(camp.location).length === 0) delete camp.location;
  }

  stats.outlines = outlineFeatures.length;
  stats.labels = labelFeatures.length;

  // Every source is bbox-checked on the way in, but this is the one thing a bad run
  // would ship straight into the app's map and Nearby distances, so re-check the
  // values actually being written rather than trusting the paths that produced them.
  for (const camp of camps) {
    const l = camp.location || {};
    if (isEmpty(l.gps_latitude) && isEmpty(l.gps_longitude)) continue;
    if (!inBBox(l.gps_longitude, l.gps_latitude)) {
      console.error(`Error: ${camp.name} (${camp.uid}) has GPS outside Black Rock City `
        + `[${l.gps_longitude}, ${l.gps_latitude}] — refusing to write`);
      process.exit(1);
    }
  }

  const campUids = new Set(camps.map((c) => c.uid));
  const unmatchedPlacement = placement.filter((r) => !campUids.has(r.uid));

  // How the two geometry sources overlap, counted over camp.json's uids: whatever is
  // "only OCR" is what the direct export is still missing, and "neither" is what the
  // map simply cannot draw.
  const ocrBorderUids = new Set(placement.filter((r) => (r.location || {}).border).map((r) => r.uid));
  const overlap = { both: 0, directOnly: 0, ocrOnly: 0, neither: 0 };
  const ocrOnlyCamps = [];
  const neitherCamps = [];
  for (const camp of camps) {
    const d = directPolygons.has(camp.uid);
    const o = ocrBorderUids.has(camp.uid);
    if (d && o) overlap.both++;
    else if (d) overlap.directOnly++;
    else if (o) { overlap.ocrOnly++; ocrOnlyCamps.push(camp); }
    else { overlap.neither++; neitherCamps.push(camp); }
  }
  const directNotInApi = [...directPolygons.keys()].filter((uid) => !campUids.has(uid));

  // Only touch update.json when camp.json really changed, so a second run is a no-op.
  const campsChanged = fs.readFileSync(campsPath, 'utf8') !== serialize(camps, false);
  if (campsChanged) {
    saveJSON(campsPath, camps, false);
    const update = loadJSON(updatePath);
    if (update.camps) {
      update.camps.updated = pacificTimestamp();
      saveJSON(updatePath, update, false);
    } else {
      warnings.push(`${updatePath} has no "camps" entry; timestamp not bumped`);
    }
  }

  saveJSON(outlinesPath, featureCollection(outlineFeatures), true);
  saveJSON(labelsPath, featureCollection(labelFeatures), true);

  console.log('\n=== Summary ===');
  console.log(`Matched camps:              ${stats.matched}`);
  console.log(`Camps without placement:    ${stats.unmatchedCamps}`);
  console.log(`Placement uids not in API:  ${unmatchedPlacement.length}`);
  console.log(`Placement fields filled:    ${stats.filledFields}`);
  console.log(`GPS from polygon centroid:  ${stats.gpsFromPolygon}`);
  console.log(`GPS from address geocode:   ${stats.gpsFromGeocoder}`);
  console.log(`GPS from entrance centroid: ${stats.gpsFromEntrance}`);
  console.log(`  newly placed:             ${stats.filledGps}`);
  console.log(`  moved from a prior point: ${stats.replacedGps}`);
  console.log(`Camps still without GPS:    ${stats.noGps}`);
  console.log(`Camps without any geometry: ${stats.noGeometry}`);
  console.log(`Distinct GPS coordinates:   ${distinctGpsCount(camps)} (was ${distinctGpsBefore})`);
  if (movements.length) {
    const sorted = movements.slice().sort((a, b) => a - b);
    const m = (n) => `${n.toFixed(0)} m`;
    console.log(`Pin movement (${movements.length} camps):     `
      + `median ${m(quantile(sorted, 0.5))}, p90 ${m(quantile(sorted, 0.9))}, `
      + `max ${m(sorted[sorted.length - 1])}, mean ${m(sorted.reduce((a, b) => a + b, 0) / sorted.length)}`);
  }
  console.log(`Outline features:           ${stats.outlines} -> ${outlinesPath}`);
  console.log(`  from direct export:       ${stats.directOutlines}`);
  console.log(`  from PDF-derived border:  ${stats.fallbackOutlines}`);
  console.log(`Label features:             ${stats.labels} -> ${labelsPath}`);
  console.log(`  at polygon centroid:      ${stats.polygonLabels}`);
  console.log(`  at drop centroid:         ${stats.centroidLabels}`);
  console.log(`camp.json:                  ${campsChanged ? 'updated (update.json timestamp bumped)' : 'unchanged (no timestamp bump)'}`);

  console.log('\n=== Polygon source overlap (over camp.json uids) ===');
  console.log(`Both sources:               ${overlap.both}`);
  console.log(`Direct export only:         ${overlap.directOnly}`);
  console.log(`PDF-derived only:           ${overlap.ocrOnly}`);
  console.log(`Neither (no outline):       ${overlap.neither}`);
  if (directNotInApi.length) console.log(`Direct polygons not in API: ${directNotInApi.length}`);
  if (ocrOnlyCamps.length) {
    console.log(`\nCamps the direct export is missing, drawn from the PDF-derived border (${ocrOnlyCamps.length}):`);
    ocrOnlyCamps.slice(0, 20).forEach((c) => console.log(`  - ${c.name} (${c.uid})`));
    if (ocrOnlyCamps.length > 20) console.log(`  ... and ${ocrOnlyCamps.length - 20} more`);
  }
  if (neitherCamps.length) {
    console.log(`\nCamps with no polygon in either source (${neitherCamps.length}):`);
    neitherCamps.slice(0, 20).forEach((c) => console.log(`  - ${c.name} (${c.uid})`));
    if (neitherCamps.length > 20) console.log(`  ... and ${neitherCamps.length - 20} more`);
  }

  if (unmatchedPlacement.length) {
    console.log(`\nPlacement records with no matching camp (${unmatchedPlacement.length}):`);
    unmatchedPlacement.slice(0, 20).forEach((r) => console.log(`  - ${r.name} (${r.uid})`));
    if (unmatchedPlacement.length > 20) console.log(`  ... and ${unmatchedPlacement.length - 20} more`);
  }
  if (conflicts.length) {
    console.log(`\nConflicts, API value kept (${conflicts.length}):`);
    conflicts.slice(0, 20).forEach((c) => console.log(`  - ${c}`));
    if (conflicts.length > 20) console.log(`  ... and ${conflicts.length - 20} more`);
  }
  if (warnings.length) {
    console.log(`\nGeometry warnings (${warnings.length}):`);
    warnings.slice(0, 20).forEach((w) => console.log(`  - ${w}`));
    if (warnings.length > 20) console.log(`  ... and ${warnings.length - 20} more`);
  }
}

main();
