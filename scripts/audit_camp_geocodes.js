#!/usr/bin/env node
// Audit every camp's shipping GPS against the map layers and the geocoder.
//
// Run after `scripts/apply_placement.js`, which is what actually writes camp GPS.
// This script never edits anything — it only reports.
//
// For each camp in `data/<year>/APIData/APIData.bundle/camp.json` it decides which
// bucket the camp is in and then checks the invariant that bucket implies:
//
//   no-address      no `location_string` and no GPS. Genuinely unplaced (mobile /
//                   support camps). Expected, not an error.
//   geocode-failure a `location_string` but no GPS at all. Every one of these is a
//                   camp the app cannot put on the map — listed in full.
//   polygon         the camp has a footprint in the placement drop, so its pin must
//                   be exactly the point `Map.bundle/camp_labels.geojson` draws its
//                   label at. Any drift means placement was not applied (or was
//                   applied from a stale drop).
//   address         no footprint, so the pin is the offline geocoder's answer for the
//                   camp's address. Re-runs `forward(location_string)` and flags a
//                   stored pin more than --geocode-tolerance metres away.
//
// Independent of bucket, every placed camp is checked for:
//   - null island (0,0) or a non-finite coordinate,
//   - sitting outside BMorg's official trash fence,
//   - sitting far from where its own address geocodes to (--frontage-tolerance,
//     reported as an anomaly for polygon camps too: a large lot legitimately puts the
//     centroid a long way off the frontage street, so this is a smell, not a failure).
//
// Usage:
//   node scripts/audit_camp_geocodes.js --year 2026
//   node scripts/audit_camp_geocodes.js --year 2026 --json out.json
//
// Options:
//   --year <YYYY>                  data year (default 2026)
//   --geocode-tolerance <metres>   address-bucket pin vs re-geocode (default 50)
//   --frontage-tolerance <metres>  any pin vs its address geocode (default 400)
//   --json <path>                  also write the full findings as JSON

const fs = require('fs');
const path = require('path');

const PLANNER = path.join(__dirname, 'BlackRockCityPlanner');
const turf = require(path.join(PLANNER, 'node_modules', '@turf', 'turf'));
const geocoderFactory = require(path.join(PLANNER, 'src', 'orggeocoder', 'factory.js'));

const ROOT = path.join(__dirname, '..');

function parseArgs(argv) {
  const args = {year: '2026', geocodeTolerance: 50, frontageTolerance: 400, json: null};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--year' || arg === '-y') args.year = argv[++i];
    else if (arg === '--geocode-tolerance') args.geocodeTolerance = Number(argv[++i]);
    else if (arg === '--frontage-tolerance') args.frontageTolerance = Number(argv[++i]);
    else if (arg === '--json') args.json = argv[++i];
    else if (arg === '--help' || arg === '-h') { printUsage(); process.exit(0); }
    else { console.error('unknown argument: ' + arg); printUsage(); process.exit(2); }
  }
  return args;
}

function printUsage() {
  console.log('usage: node scripts/audit_camp_geocodes.js [--year YYYY] ' +
    '[--geocode-tolerance m] [--frontage-tolerance m] [--json path]');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function metres(a, b) {
  return turf.distance(turf.point(a), turf.point(b), {units: 'kilometers'}) * 1000;
}

/** Every ring of every polygon/multipolygon in a FeatureCollection, as one test. */
function containsPoint(featureCollection, coordinates) {
  const point = turf.point(coordinates);
  return featureCollection.features.some(function (feature) {
    const type = feature.geometry && feature.geometry.type;
    if (type !== 'Polygon' && type !== 'MultiPolygon') return false;
    return turf.booleanPointInPolygon(point, feature);
  });
}

function main() {
  const args = parseArgs(process.argv);
  const year = args.year;
  const dataDir = path.join(ROOT, 'data', year);

  const campsPath = path.join(dataDir, 'APIData', 'APIData.bundle', 'camp.json');
  const labelsPath = path.join(dataDir, 'Map', 'Map.bundle', 'camp_labels.geojson');
  const outlinesPath = path.join(dataDir, 'Map', 'Map.bundle', 'camp_outlines.geojson');
  const fencePath = path.join(ROOT, 'bmorg', 'innovate-GIS-data', year, 'GeoJSON', 'trash_fence.geojson');

  const camps = readJson(campsPath);
  const labels = fs.existsSync(labelsPath) ? readJson(labelsPath) : {features: []};
  const outlines = fs.existsSync(outlinesPath) ? readJson(outlinesPath) : {features: []};
  const fence = fs.existsSync(fencePath) ? readJson(fencePath) : null;
  const geocoder = geocoderFactory.forYear(ROOT, year);

  console.log('Auditing ' + year + ' camp geocodes');
  console.log('  camps:    ' + campsPath + ' (' + camps.length + ')');
  console.log('  labels:   ' + labelsPath + ' (' + labels.features.length + ' features)');
  console.log('  outlines: ' + outlinesPath + ' (' + outlines.features.length + ' features)');
  console.log('  fence:    ' + (fence ? fencePath : 'MISSING — fence containment skipped'));
  console.log('  geocoder: ' + (geocoder ? 'official BMorg GIS (' + year + ')' : 'MISSING — geocode checks skipped'));
  console.log('');

  const labelByUid = new Map();
  labels.features.forEach(function (feature) {
    labelByUid.set(feature.properties.uid, feature.geometry.coordinates);
  });
  const outlineUids = new Set(outlines.features.map(function (f) { return f.properties.uid; }));

  const buckets = {'no-address': [], 'geocode-failure': [], polygon: [], address: []};
  const failures = {
    centroidMismatch: [],   // polygon camp whose pin is not its label point
    regeocodeMismatch: [],  // address camp whose pin is not what its address geocodes to
    nullIsland: [],
    outsideFence: [],
    farFromFrontage: [],
    labelWithoutCamp: [],
    outlineWithoutLabel: []
  };
  const frontageOffsets = [];

  camps.forEach(function (camp) {
    const location = camp.location || {};
    const address = camp.location_string || null;
    const lat = location.gps_latitude;
    const lon = location.gps_longitude;
    const hasGps = typeof lat === 'number' && typeof lon === 'number';
    const record = {uid: camp.uid, name: camp.name, address: address, lat: lat, lon: lon};

    if (!hasGps) {
      buckets[address ? 'geocode-failure' : 'no-address'].push(record);
      return;
    }

    const coordinates = [lon, lat];

    if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) {
      failures.nullIsland.push(record);
      return;
    }

    if (fence && !containsPoint(fence, coordinates)) {
      failures.outsideFence.push(record);
    }

    const labelCoordinates = labelByUid.get(camp.uid);
    if (labelCoordinates) {
      buckets.polygon.push(record);
      const drift = metres(coordinates, labelCoordinates);
      // apply_placement writes both from the same value, rounded to 6 dp: ~0.1 m.
      if (drift > 1) {
        failures.centroidMismatch.push(Object.assign({driftM: drift, label: labelCoordinates}, record));
      }
    } else {
      buckets.address.push(record);
      if (geocoder && address) {
        const result = geocoder.forward(address);
        if (!result) {
          failures.regeocodeMismatch.push(Object.assign({reason: 'address no longer geocodes'}, record));
        } else {
          const offset = metres(coordinates, result.geometry.coordinates);
          if (offset > args.geocodeTolerance) {
            failures.regeocodeMismatch.push(Object.assign(
              {offsetM: offset, geocoded: result.geometry.coordinates}, record));
          }
        }
      }
    }

    if (geocoder && address) {
      const result = geocoder.forward(address);
      if (result) {
        const offset = metres(coordinates, result.geometry.coordinates);
        frontageOffsets.push(offset);
        if (offset > args.frontageTolerance) {
          failures.farFromFrontage.push(Object.assign({offsetM: offset}, record));
        }
      }
    }
  });

  const campUids = new Set(camps.map(function (c) { return c.uid; }));
  labelByUid.forEach(function (_coordinates, uid) {
    if (!campUids.has(uid)) failures.labelWithoutCamp.push({uid: uid});
  });
  outlineUids.forEach(function (uid) {
    if (!labelByUid.has(uid)) failures.outlineWithoutLabel.push({uid: uid});
  });

  const total = camps.length;
  console.log('=== Buckets ===');
  console.log('Camps:                        ' + total);
  console.log('  placed from polygon:        ' + buckets.polygon.length);
  console.log('  placed from address geocode:' + buckets.address.length);
  console.log('  no GPS, has an address:     ' + buckets['geocode-failure'].length + '  <- geocode failures');
  console.log('  no GPS, no address at all:  ' + buckets['no-address'].length + '  <- unplaced upstream');
  console.log('');

  console.log('=== Checks ===');
  report('Pin != its camp_labels point (placement not applied)', failures.centroidMismatch, function (f) {
    return f.driftM.toFixed(1) + ' m off ' + JSON.stringify(f.label);
  });
  report('Pin != re-geocode of its own address (>' + args.geocodeTolerance + ' m)',
    failures.regeocodeMismatch, function (f) {
      return f.reason || (f.offsetM.toFixed(1) + ' m from ' + JSON.stringify(f.geocoded));
    });
  report('Null island / non-finite coordinate', failures.nullIsland, function () { return ''; });
  report('Outside the trash fence', failures.outsideFence, function (f) {
    return f.lat + ',' + f.lon;
  });
  report('Far from its own address geocode (>' + args.frontageTolerance + ' m)',
    failures.farFromFrontage, function (f) { return f.offsetM.toFixed(0) + ' m'; });
  report('camp_labels feature with no camp', failures.labelWithoutCamp, function () { return ''; });
  report('camp_outlines feature with no label', failures.outlineWithoutLabel, function () { return ''; });

  if (frontageOffsets.length) {
    frontageOffsets.sort(function (a, b) { return a - b; });
    const at = function (q) { return frontageOffsets[Math.floor(frontageOffsets.length * q)]; };
    console.log('');
    console.log('Pin-to-address-geocode offset over ' + frontageOffsets.length + ' camps: ' +
      'median ' + at(0.5).toFixed(0) + ' m, p90 ' + at(0.9).toFixed(0) + ' m, ' +
      'p99 ' + at(0.99).toFixed(0) + ' m, max ' +
      frontageOffsets[frontageOffsets.length - 1].toFixed(0) + ' m');
  }

  if (buckets['geocode-failure'].length) {
    console.log('');
    console.log('=== Geocode failures (address present, no GPS) ===');
    buckets['geocode-failure'].forEach(function (c) {
      console.log('  - ' + c.name + ' (' + c.uid + '): ' + JSON.stringify(c.address));
    });
  }

  if (buckets['no-address'].length) {
    console.log('');
    console.log('=== Unplaced upstream (no address, no GPS) ===');
    buckets['no-address'].forEach(function (c) {
      console.log('  - ' + c.name + ' (' + c.uid + ')');
    });
  }

  if (buckets.address.length) {
    console.log('');
    console.log('=== Placed by address geocode (no placement polygon) ===');
    buckets.address.forEach(function (c) {
      console.log('  - ' + c.name + ' (' + c.uid + '): ' + JSON.stringify(c.address) +
        ' -> ' + c.lat + ',' + c.lon);
    });
  }

  const anomalyCount = Object.keys(failures).reduce(function (sum, key) {
    return sum + failures[key].length;
  }, 0) + buckets['geocode-failure'].length;

  console.log('');
  console.log(anomalyCount === 0
    ? 'PASS — no geocode failures or anomalies.'
    : 'Findings: ' + anomalyCount + ' (see above).');

  if (args.json) {
    fs.writeFileSync(args.json, JSON.stringify({buckets: buckets, failures: failures}, null, 2));
    console.log('Wrote ' + args.json);
  }
}

function report(label, list, detail) {
  console.log((list.length ? 'FAIL ' : 'ok   ') + label + ': ' + list.length);
  list.slice(0, 25).forEach(function (item) {
    const extra = detail(item);
    console.log('       - ' + (item.name || '') + ' (' + item.uid + ')' + (extra ? ' — ' + extra : ''));
  });
  if (list.length > 25) console.log('       ... and ' + (list.length - 25) + ' more');
}

main();
