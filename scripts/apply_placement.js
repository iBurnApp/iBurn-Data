#!/usr/bin/env node
// Merge the restricted camp placement drop into the shipping data bundles.
//
// Input is `data/<year>/placement/campsgeocodedwithborders.json` — the brcMapTools
// drop traced from the official Public Camp Map PDF (see that directory's README for
// provenance and the embargo rules). Each record carries the same `uid` as
// `APIData.bundle/camp.json` plus two things the BMorg API does not serve:
//
//   - `location.centroid` — GeoJSON Point, the camp's position on the map
//   - `location.border`   — GeoJSON Polygon, the camp's drawn footprint
//
// This script:
//
//   1. Backfills `camp.json` placement fields from the drop, FILL-ONLY: a value the
//      API already supplied is never overwritten. Where the API and the drop disagree
//      the API wins and the conflict is logged. (In the 2026-08-09 data every textual
//      field agrees, so this only ever fills genuine holes.)
//   2. Backfills `location.gps_latitude`/`gps_longitude` from the drop's centroid for
//      camps that have no GPS — i.e. the handful `fetch_and_geocode.js` could not
//      geocode from their address. See --gps-source to prefer the drop instead.
//   3. Bumps `update.json`'s `camps.updated` so the app re-imports over any older seed
//      — but only when camp.json actually changed, which keeps re-runs no-ops.
//   4. Regenerates `Map.bundle/camp_outlines.geojson` (Polygon features) and
//      `Map.bundle/camp_labels.geojson` (Point features), both carrying
//      `properties: {uid, name}` so the map can label and identify each camp.
//
// The script is idempotent: running it twice yields byte-identical files.
//
// Usage (from Submodules/iBurn-Data):
//   node scripts/apply_placement.js [--year 2026] [--gps-source geocoder|centroid]
//                                   [--dry-run] [--verbose]
//
// Paths can be overridden individually with --placement / --camps / --update /
// --outlines / --labels.

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
const gpsSource = opt('--gps-source', 'geocoder');
if (gpsSource !== 'geocoder' && gpsSource !== 'centroid') {
  console.error(`Error: --gps-source must be "geocoder" or "centroid" (got "${gpsSource}")`);
  process.exit(1);
}

const dataRoot = path.join(__dirname, '..', 'data');
const bundleDir = path.join(dataRoot, year, 'APIData', 'APIData.bundle');
const mapBundleDir = path.join(dataRoot, year, 'Map', 'Map.bundle');

const placementPath = opt('--placement', path.join(dataRoot, year, 'placement', 'campsgeocodedwithborders.json'));
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
function borderOf(record, warnings) {
  const b = (record.location || {}).border;
  if (!b || b.type !== 'Polygon' || !Array.isArray(b.coordinates)) return null;
  const rings = [];
  for (const ring of b.coordinates) {
    if (!Array.isArray(ring) || ring.length < 4) {
      warnings.push(`${record.name}: border ring has ${Array.isArray(ring) ? ring.length : 0} points, skipping`);
      return null;
    }
    const out = [];
    for (const [lon, lat] of ring) {
      if (!inBBox(lon, lat)) {
        warnings.push(`${record.name}: border vertex outside Black Rock City [${lon}, ${lat}], skipping`);
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

function featureCollection(features) {
  return { type: 'FeatureCollection', features };
}

function main() {
  const placement = loadJSON(placementPath);
  const camps = loadJSON(campsPath);
  if (!Array.isArray(placement) || !Array.isArray(camps)) {
    console.error('Error: expected both placement and camp.json to be JSON arrays');
    process.exit(1);
  }

  console.log(`Applying ${year} placement`);
  console.log(`  placement: ${placementPath} (${placement.length} records)`);
  console.log(`  camps:     ${campsPath} (${camps.length} camps)`);
  console.log(`  gps source: ${gpsSource === 'centroid' ? 'drop centroid (API geocode as fallback)' : 'address geocode (drop centroid as fallback)'}`);
  if (dryRun) console.log('  (dry run — no files written)');

  const byUid = new Map();
  for (const record of placement) {
    if (byUid.has(record.uid)) console.warn(`Warning: duplicate placement uid ${record.uid} (${record.name})`);
    byUid.set(record.uid, record);
  }

  const warnings = [];
  const conflicts = [];
  const stats = {
    matched: 0, unmatchedCamps: 0, filledFields: 0, filledGps: 0,
    replacedGps: 0, noGps: 0, outlines: 0, labels: 0, noGeometry: 0
  };

  // Driven off camp.json so a camp the API dropped can never leak back in through the
  // map layers, and so feature order is stable across runs.
  const outlineFeatures = [];
  const labelFeatures = [];

  for (const camp of camps) {
    const record = byUid.get(camp.uid);
    if (!record) {
      stats.unmatchedCamps++;
      if (verbose) console.log(`  no placement for ${camp.name} (${camp.uid})`);
      continue;
    }
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

    const centroid = centroidOf(record, warnings);
    const border = borderOf(record, warnings);
    const hasGps = !isEmpty(camp.location.gps_latitude) && !isEmpty(camp.location.gps_longitude);
    if (centroid && (!hasGps || gpsSource === 'centroid')) {
      // camp.json orders gps after the address fields; assigning in place keeps that.
      const changed = camp.location.gps_latitude !== centroid[1] || camp.location.gps_longitude !== centroid[0];
      camp.location.gps_latitude = centroid[1];
      camp.location.gps_longitude = centroid[0];
      if (changed) {
        if (hasGps) stats.replacedGps++;
        else stats.filledGps++;
      }
    } else if (!hasGps && !centroid) {
      stats.noGps++;
      if (verbose) console.log(`  no GPS for ${camp.name} (no geocode, no centroid)`);
    }

    // An empty location object is noise; camps with nothing placed shouldn't grow one.
    if (Object.keys(camp.location).length === 0) delete camp.location;

    const properties = { uid: camp.uid, name: camp.name };
    if (border) {
      outlineFeatures.push({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: border } });
    }
    if (centroid) {
      labelFeatures.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: centroid } });
    }
    if (!border && !centroid) stats.noGeometry++;
  }

  stats.outlines = outlineFeatures.length;
  stats.labels = labelFeatures.length;

  const campUids = new Set(camps.map((c) => c.uid));
  const unmatchedPlacement = placement.filter((r) => !campUids.has(r.uid));

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
  console.log(`GPS filled from centroid:   ${stats.filledGps}`);
  if (stats.replacedGps) console.log(`GPS replaced by centroid:   ${stats.replacedGps}`);
  console.log(`Camps still without GPS:    ${stats.noGps}`);
  console.log(`Camps without any geometry: ${stats.noGeometry}`);
  console.log(`Outline features:           ${stats.outlines} -> ${outlinesPath}`);
  console.log(`Label features:             ${stats.labels} -> ${labelsPath}`);
  console.log(`camp.json:                  ${campsChanged ? 'updated (update.json timestamp bumped)' : 'unchanged (no timestamp bump)'}`);

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
