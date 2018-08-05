var turf = require('turf')
var leven = require('levenshtein');

var lastYearCenter = [-119.20315, 40.78880];
var thisYearCenter = [-119.2065, 40.7864];

var distance = turf.distance(turf.point(lastYearCenter),turf.point(thisYearCenter),'kilometers');
var bearing = turf.bearing(turf.point(lastYearCenter),turf.point(thisYearCenter));

// Loose string match score above this value results in auto-match
const CONFIDENT_MATCH_THRESHOLD = .9;
// Loose string match above this value, but below CONFIDENT_MATCH_THRESHOLD is a candidate for human matching
const POSSIBLE_MATCH_THRESHOLD = .51;

module.exports.fixCoordinate = function(coordinates) {
  return turf.destination(turf.point(coordinates),distance,bearing,'kilometers').geometry.coordinates;
}

module.exports.findPlayaEventsId = function(wikiItem, playaEvntsJSON,hardcodedJSON, callback) {

  var bestMatch;
  var bestMatchScore = 0;

  var name = hardcodedJSON[wikiItem.properties.name];
  if (name === undefined) {
    name = wikiItem.properties.name;
  }

  for (var idx = 0; idx < playaEvntsJSON.length; idx++) {
    var item = playaEvntsJSON[idx];
    var score = matchString(wikiItem.properties.name, item.name);
    if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = item;
        if (score == 1) break;
    }
  }


  if (bestMatchScore >= CONFIDENT_MATCH_THRESHOLD) {
    callback(bestMatch.id);
  } else if (bestMatchScore >= POSSIBLE_MATCH_THRESHOLD) {
    callback(null,wikiItem.properties.name + ' - ' + bestMatch.name +' -- '+bestMatchScore);
  } else {
    callback(null, "NO MATCH - "+wikiItem.properties.name);
  }
}

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
