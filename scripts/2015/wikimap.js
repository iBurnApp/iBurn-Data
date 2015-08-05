/**
 * This file is an (incomplete) attempt at extracting camp locations from Burning Man wiki data (https://www.google.com/maps/d/u/1/viewer?usp=sharing&mid=zkszwyFJ-h7E.kaxgaF8gR5Sw&authuser=1)
 * adjusting the locations in wiki data for the 2015 BRC, and finally merging those adjusted locations into
 * PlayaEvents Camps and Events json.
 *
 * Created by dbro on 7/31/15.
 */
var fs = require('fs');
var leven = require('levenshtein');
var Geocoder = require('./geocoder.js');

var cityCenter = {
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [-119.20315, 40.78880]}
};

var centerCamp = {
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [-119.21044571526275, 40.78338244255566]}
};

var cityBearingDegrees = 45;

var geocoder = new Geocoder(cityCenter, cityBearingDegrees, centerCamp);


/**
 * Lat, Lon adjustment between wiki and PlayaEvents data.
 *  e.g: Wiki latitude + LAT_DELTA = PlayaEvents latitude
 */
const LAT_DELTA = -0.0024633000000022776;
const LON_DELTA = -0.0030433000000016364;

/**
 * Input files
 */

/** PlayaEvents json */
var campsFilePath = '/Users/dbro/Code/iBurn-Data/data/2015/camps.json.js';
var eventsFilePath = '/Users/dbro/Code/iBurn-Data/data/2015/events.json.js';

/** Unofficial BRC camps location
 *  from https://www.google.com/maps/d/viewer?usp=sharing&mid=zkszwyFJ-h7E.kaxgaF8gR5Sw
 */
var wikiFilePath = '/Users/dbro/Downloads/brc_facilities.geojson';

/**
 * Output files
 */

/** Adjusted wiki locations json */
var adjustedWikiFilePath = '/Users/dbro/Downloads/facilities_adjusted.geojson';

/** Final output PlayaEvents json with unofficial locations */
var locatedCampsFilePath = '/Users/dbro/Desktop/2015_camps_location.json.js';
var locatedEventsFilePath = '/Users/dbro/Desktop/2015_events_location.json.js';

/**
 * Wiki camp names matched to their PlayaEvents counterpart derived from old-fashioned human labor.
 */
var curatedWikiToPeName = {
    // Not matches
    'Reverbia Live Music': 'Reverbia',
    'BRC Museum of Science Industry and Technology': 'Museum of Industry Science & Tech',
    'Pongo': 'Pongo Lounge',
    'Desert Morning: Home of the Lovin\' Oven': 'Desert Morning',
    'Camp 9': 'Stag Camp 9',
    'Hi!': 'hi! hi!',

    // Possible matches
    'Canadianderthals': 'CANADIANEANDERTHAL',
    'Sensual Pleasures': 'Sensual Pleasures (The Camp for)',
    'end0r': 'endoR',
    'WooWoo': 'Woop Woop',
    'The Safety Net': 'Safety Net, The',
    'The Empress': 'Empress Theme Camp',
    'Fade to White': 'Fade to White - MN Midway',
    'Colorado Midway Project Camp': 'Colorado Midway Camp',
    'Catmandu | Camp Optimistic Cat Den': 'Camp: Optimistic Cat Den',
    'Bill\'s Golf n Glo': 'Bill\'s Golf and Glo',
    'Bioluminati | Bike Mutation Station': 'Bioluminati / Bike Mutation',
    'Big Imagination | 747 Camp': 'Big Imagination',
    'Animal Control': 'BRC Animal Control',
    'THE YARD (Village)': 'Yard, The',
    'Cock \'n Candy Midway Support': 'Cock N Candy & Dionysus Art Car',
    'Radio Electra': 'Radio Electra 89.9 FM',
    'Lil\' CrackWhores': 'Crackwhore Camp',
    'Hanging Gardens': 'Hanging Gardens of BRC',
    'Fabio\'s Fun House': 'Fun House',
    'Spanky\'s Wine Bar': 'Spanky\'s Village and Wine Bar',
    'BRC Hardware Shoppe': 'Black Rock City Hardware Shoppe',
    'Barbie Death Camp and Wine Bar': 'Barbie Death Camp',
    'VICE - Vietnamese Iced Coffee Experience': 'Vietnamese Iced Coffee Experience',
    'Ooligan Alley )\'( Ooligan Airways': ')\'(Ooligan Airways',
    'BREAKFAST (Village)': 'The Breakfast Club',
    'It\'s All Made Up (IAMU)': 'It\'s All Made Up',
    'Wülfden': 'Wulf Den',
    'Scarbutts Cafe': 'Scarbutts Coffee',
    'Spice & Vice': 'Spice N Vice',
    '3SP (Third Space Place)': 'Third Space Place',
    'The Enchanted Booty Forest': 'Enchanted Booty Village',
    'The Hang-Out': 'Hang-Out, the',
    'Dream Society / Asterix': 'Dream Society',
    'Last Resort County Club': 'Last Resort Country Club (LRC)',
    'A Cavallo and Thunder Gumbo Village': 'A Cavallo + Thunder Gumbo Village',
    'Dr Carl\'s Department of Collections': 'Dr. Carl\'s Dept. of Collections'
};

fs.readFile(wikiFilePath, 'utf8', function (err, wData) {
    if (err) {
        return console.log(err);
    }

    fs.readFile(campsFilePath, 'utf8', function (err, peCampsData) {
        if (err) {
            return console.log(err);
        }

        fs.readFile(eventsFilePath, 'utf8', function (err, peEventsData) {
            if (err) {
                return console.log(err);
            }

            var peCampsJson = JSON.parse(peCampsData);
            var peEventsJson = JSON.parse(peEventsData);
            var wJson = JSON.parse(wData);

            // Adjust the Wiki locations via LON_DELTA and LAT_DELTA
            wJson = adjustLatLon(wJson, LON_DELTA, LAT_DELTA);

            // Build a hash of wiki camp names to location objects. A location object includes 'lat', 'lon' and 'address'
            //var wNamesToLoc = makeWikiNameToLocationMap(wJson);

            // Build a hash of PlayaEvents camp names to Wiki camp names
            //var peToWName = matchWikiGeoWithPlayaEventsCamps(wJson, peCampsJson);

            // Update PlayaEvents camp json with locations from Wiki data
            //var locatedPeCampsJson = mergeWikiGeoWithPlayaEventsCamps(wJson, peCampsJson, peToWName, wNamesToLoc);

            // Update PlayaEvents events json with locations from Wiki data
            //var locatedPeEventsJson = mergeWikiGeoWithPlayaEventsEvents(wJson, peEventsJson, peToWName, wNamesToLoc);

            // Write output to file

            //fs.writeFile(locatedCampsFilePath, JSON.stringify(locatedPeCampsJson, null, '\t'));
            //fs.writeFile(locatedEventsFilePath, JSON.stringify(locatedPeEventsJson, null, '\t'));
            //fs.writeFile(adjustedWikiFilePath, JSON.stringify(wJson, null, '\t'));

        });
    });
});

var adjustLatLon = function (jsonData, lon_delta, lat_delta) {
    for (var idx = 0; idx < jsonData.features.length; idx++) {
        var coordinates = jsonData.features[idx].geometry.coordinates;
        if (coordinates !== undefined) {
            coordinates[0] += lon_delta;
            coordinates[1] += lat_delta;
        }
    }
    return jsonData;
};

var listWikiNames = function (wikiGeoJson) {
    for (var idx = 0; idx < wikiGeoJson.features.length; idx++) {
        cleanString(wikiGeoJson.features[idx].properties.name);
    }
};
var mergeWikiGeoWithPlayaEventsCamps = function (wikiGeoJson, playaEventsCampsJson, playaEventsToWikiNames, wikiNamesToLoc) {

    for (var peIdx = 0; peIdx < playaEventsCampsJson.length; peIdx++) {

        var peName = playaEventsCampsJson[peIdx].name;
        var wName;
        if ((wName = playaEventsToWikiNames[peName]) !== undefined) {
            var wLocation = wikiNamesToLoc[wName];
            playaEventsCampsJson[peIdx].location = wLocation.address;
            playaEventsCampsJson[peIdx].latitude = wLocation.coordinates[1];
            playaEventsCampsJson[peIdx].longitude = wLocation.coordinates[0];
        }
    }
    return playaEventsCampsJson;
};

var mergeWikiGeoWithPlayaEventsEvents = function (wikiGeoJson, playaEventsEventsJson, playaEventsToWikiNames, wikiNamesToLoc) {
    // Events specify location in one of three ways:
    // 1. A hosted_by_camp reference:
    //
    // "hosted_by_camp": {
    //    "name": "Camp Thump Thump",
    //    "id": 7993
    //  },
    //
    // 2. An 'other_location' field that is a camp name, playa address or description:
    //
    //  "other_location": "On the Midway at the foot of THE MAN",
    //
    // 3. A 'located_at_art' field:
    //
    //  "located_at_art": {
    //     "location_string": "11:55 150', Man Pavilion",
    //     "name": "Dr. Thelonious D. RUM Medicinal Thump Thump Magical Healing Excursion",
    //     "id": 2407
    //  }

    for (var peIdx = 0; peIdx < playaEventsEventsJson.length; peIdx++) {

        var peName;

        var peItem = playaEventsEventsJson[peIdx];

        if (peItem.hosted_by_camp !== undefined) {

            peName = peItem.hosted_by_camp.name;

        } else if (peItem.other_location != undefined) {

            peName = peItem.other_location;

        } else if (peItem.located_at_art !== undefined &&
            peItem.located_at_art.location_string !== undefined) {

            var timeDistance = peItem.located_at_art.location_string;
            var latLng = geocoder.timeDistanceToLatLon(timeDistance.split(' ', 1)[0], timeDistance.split(' ', 1)[1].replace('\'', ''), 'kilometers');

            peItem.location = timeDistance;
            peItem.latitude = latLng.coordinates[1];
            peItem.longitude = latLng.coordinates[0];

        }

        var wName;
        if (peName !== undefined && (wName = playaEventsToWikiNames[peName]) !== undefined) {
            var wLocation = wikiNamesToLoc[wName];
            peItem.location = wLocation.address;
            peItem.latitude = wLocation.coordinates[1];
            peItem.longitude = wLocation.coordinates[0];
        }
    }
    return playaEventsEventsJson;
};

var matchWikiGeoWithPlayaEventsCamps = function (wikiGeoJson, playaEventsCampsJson) {

    // Output
    var wikiToPeNamePath = '/Users/dbro/Downloads/wiki_to_pe.json';
    var confidentMatchPath = '/Users/dbro/Downloads/confident_matches.json';
    var possibleMatchPath = '/Users/dbro/Downloads/possible_matches.json';
    var noMatchPath = '/Users/dbro/Downloads/no_matches.json';

    var confidentOutput = fs.createWriteStream(confidentMatchPath);
    var possibleMatchOutput = fs.createWriteStream(possibleMatchPath);
    var unmatchOutput = fs.createWriteStream(noMatchPath);

    // Loose string match score above this value results in auto-match
    const CONFIDENT_MATCH_THRESHOLD = .9;
    // Loose string match above this value, but below AUTO_MATCH is a candidate for human matching
    const POSSIBLE_MATCH_THRESHOLD = .51;

    var unmatchedCampNames = [];
    var possibleMatchCampNames = [];
    var matchedCampNames = [];
    // PlayaEvent name -> Wiki camps name
    var peIdToWIdx = {};

    for (var wIdx = 0; wIdx < wikiGeoJson.features.length; wIdx++) {
        if (wikiGeoJson.features[wIdx].properties === undefined) {
            console.log('Wiki entry ' + wIdx + ' has no properties');
            continue;
        }
        var wName = wikiGeoJson.features[wIdx].properties.name;

        var bestMatchName;
        var bestMatchScore = 0;

        if (curatedWikiToPeName[wName] !== undefined) {
            console.log('Got match for ' + wName + ' : ' + curatedWikiToPeName[wName]);
            matchedCampNames.push(wName);
            peIdToWIdx[curatedWikiToPeName[wName]] = wName;
            confidentOutput.write(makeMatchReportString(1, wName, curatedWikiToPeName[wName]));
            continue;
        }

        for (var peIdx = 0; peIdx < playaEventsCampsJson.length; peIdx++) {

            var peName = playaEventsCampsJson[peIdx].name;

            var score = matchString(peName, wName);
            if (score > bestMatchScore) {
                bestMatchScore = score;
                bestMatchName = peName;
                if (score == 1) break;
            }
        }

        if (bestMatchScore >= CONFIDENT_MATCH_THRESHOLD) {
            matchedCampNames.push(wName);
            peIdToWIdx[bestMatchName] = wName;
            confidentOutput.write(makeMatchReportString(bestMatchScore, wName, bestMatchName));
            //console.log('Match ' + peName + ' with ' + bestMatchName + ' score: ' + bestMatchScore);
        } else if (bestMatchScore >= POSSIBLE_MATCH_THRESHOLD) {
            possibleMatchCampNames.push(bestMatchName);
            possibleMatchOutput.write(makeMatchReportString(bestMatchScore, wName, bestMatchName));
        } else {
            unmatchedCampNames.push(wName);
            unmatchOutput.write(makeMatchReportString(bestMatchScore, wName, bestMatchName));
            //console.log('No match for playaEvents name ' + peName);
        }
    }
    possibleMatchOutput.destroy();
    unmatchOutput.destroy();
    confidentOutput.destroy();
    console.log('Confident Match Rate ' + Math.floor((matchedCampNames.length / wikiGeoJson.features.length) * 100) + '% items: ' + matchedCampNames.length);
    console.log('Possible Match Rate ' + Math.floor((possibleMatchCampNames.length / wikiGeoJson.features.length) * 100) + '% items: ' + possibleMatchCampNames.length);
    console.log('No Match Rate ' + Math.floor((unmatchedCampNames.length / wikiGeoJson.features.length) * 100) + '% items: ' + unmatchedCampNames.length);

    return peIdToWIdx;
};

/**
 * @param wikiGeoJson
 * @return a hash of 'camp name' to {coordinates: [lat, lon], address: 'playa address'}.
 *          Note that the 'address' component is not guaranteed to be present.
 */
var makeWikiNameToLocationMap = function (wikiGeoJson) {
    var wNameToLoc = {};

    for (var wIdx = 0; wIdx < wikiGeoJson.features.length; wIdx++) {
        var location = {
            'coordinates': wikiGeoJson.features[wIdx].geometry.coordinates,
        };

        if (wikiGeoJson.features[wIdx].properties.Address) {
            location.address = wikiGeoJson.features[wIdx].properties['Address'].replace(/, Black Rock City, NV/, '');
        }

        wNameToLoc[wikiGeoJson.features[wIdx].properties.name] = location;
    }
    return wNameToLoc;
};

var makeMatchReportString = function (score, target, candidate) {
    return '\nPossible Match (' + score + ')\n\t'
        + target + '\n\t'
        + candidate + '\n\t\t'
        + cleanString(target) + '\n\t\t'
        + cleanString(candidate);
};
var matchString = function (target, candidate) {
    var clean_target = cleanString(target);
    var clean_candidate = cleanString(candidate);
    var largestNameLength = Math.max(clean_candidate.length, clean_target.length);
    return (largestNameLength - new leven(clean_target, clean_candidate).distance) / largestNameLength;
};

var cleanString = function (input) {
    var result = input.toLowerCase()
        .replace(/[|!:;$%@"'<>?()+--*.,]/g, "")
        .replace(/&/, 'and')
        .replace(/the /, '')
        .replace(/[  \t\r]+/g, "")       // Remove all whitespace, including nbsp
        .replace(/camp/, '')
        .replace(/village/, '');
    return result;
};