#! /usr/bin/env node
var turf  = require('turf');
var utils = require('./utils.js')
turf.multilinestring = require('turf-multilinestring')

if (!process.argv[2]) {
    console.log('Usage: layout.js [file]');
    process.exit(1);
}

var layoutFile = require(process.argv[2]);

console.log("Creating Circle Streets...")
var circleStreets = circleStreetsFeatureCollection(layoutFile);
console.log("Creating Time Streets...")
var timeStreets = tieStreetsFeatureCollection(layoutFile);
timeStreets.features = timeStreets.features.concat(circleStreets.features)
console.log("%j",timeStreets);

function tieStreetsFeatureCollection(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;

  var distanceLookup = {};
  jsonFile.cStreets.map(function(item){
    distanceLookup[item.ref] = item.distance;
  });
  var features = [];
  jsonFile.tStreets.map(function(item){

    item.refs.map(function(timeString){
      var lines = [];
      var timeArray = utils.splitTimeString(timeString);
      var hour = timeArray[0];
      var minute = timeArray[1];
      var bearing = utils.timeToCompassDegrees(hour,minute,cityBearing);
      item.segments.map(function(segment){
        var start = utils.feetToMiles(distanceFromCenter(distanceLookup,segment[0]));
        var end = utils.feetToMiles(distanceFromCenter(distanceLookup,segment[1]));

        var startPoint = turf.destination(cityCenter,start,bearing,'miles');
        var endPoint = turf.destination(cityCenter,end,bearing,'miles');

        lines.push([startPoint.geometry.coordinates,endPoint.geometry.coordinates]);
      })
      features.push(turf.multilinestring(lines,{"ref":timeString,"name":timeString}));
    });

  });
  return turf.featurecollection(features);
}

function distanceFromCenter(lookup, value) {
  if (typeof value === 'string') {
    return lookup[value];
  } else if (typeof value === 'number') {
    return value
  } else {
    return undefined;
  }
}

//Takes in json file spits out all the circle streets
function circleStreetsFeatureCollection(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;

  var circleStreetsFeatures = []

  layoutFile.cStreets.map( function(item){
    var distance = utils.feetToMiles(item.distance);
    var units = 'miles';
    var properties = {
      "ref":item.ref,
      "name":item.name,
    };
    var multiLineString = turf.multilinestring([],properties);
    var segments = item.segments;
    segments.map( function(segment){
      var splitStartTime = utils.splitTimeString(segment[0]);
      var splitEndTime = utils.splitTimeString(segment[1]);
      var startBearing = utils.timeToCompassDegrees(splitStartTime[0],splitEndTime[1],cityBearing);
      var endBearing = utils.timeToCompassDegrees(splitEndTime[0],splitEndTime[1],cityBearing);
      var arc = createArc(cityCenter,distance,units,startBearing,endBearing,5)
      multiLineString.geometry.coordinates.push(arc.geometry.coordinates);
    });

    circleStreetsFeatures.push(multiLineString);

  });

  return turf.featurecollection(circleStreetsFeatures);
}

//Bearing [-180, 180]
//Always works clockwise
function createArc(center, distance, units, startBearing, endBearing, bearingFrequency) {

  var points = [];

  var currentBearing = startBearing;
  while (bearingCompare(endBearing, currentBearing) || currentBearing !== endBearing) {

    var currentPoint = turf.destination(center,distance,currentBearing,units);
    points.push(currentPoint.geometry.coordinates);

    currentBearing += bearingFrequency;
    if (currentBearing > 180) {
      currentBearing += -360
    }
  }

  //One more for the end
  var currentPoint = turf.destination(center,distance,endBearing,units);
  points.push(currentPoint.geometry.coordinates);

  return turf.linestring(points);
}

// Bearing [-180, 180] if first bearing is further along clockwise than second bearing
// returns true
function bearingCompare(firstBearing, secondBearing) {
  //convert to [0, 360]
  firstBearing = (firstBearing % 360 + 360) % 360;
  secondBearing = (secondBearing % 360 + 360) % 360;

  return secondBearing < firstBearing;
}
