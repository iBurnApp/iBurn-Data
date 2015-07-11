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
var allStreets = timeStreetsFeatureCollection(layoutFile);
allStreets.features = allStreets.features.concat(circleStreets.features)
console.log("Creating Plazas...")
var plazas = plazasFeatureCollection(layoutFile);
allStreets.features = allStreets.features.concat(plazas.features)
console.log("Creating Center Camp...")
var centerCamp = centerCampFeatureCollection(layoutFile);
allStreets.features = allStreets.features.concat(centerCamp.features)
console.log("%j",allStreets);

function centerCampFeatureCollection(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;
  var centerCampDistance = utils.feetToMiles(jsonFile.center_camp.distance);
  var bearing = utils.timeToCompassDegrees("6","0",cityBearing);
  var centerCampCenter = turf.destination(cityCenter,centerCampDistance,bearing,'miles');

  //Cafe
  var cafeRadius = utils.feetToMiles(jsonFile.center_camp.cafe_radius);
  var cafe = createArc(centerCampCenter, cafeRadius, 'miles', 0, 360, 5);
  cafe.properties = {
    "name":"Café",
    "ref":"cafe"
  }

  //Plaza
  var plazaRadius = utils.feetToMiles(jsonFile.center_camp.cafe_plaza_radius);
  var plaza = createArc(centerCampCenter, plazaRadius, 'miles', 0, 360, 5);
  //Create hole for cafe
  plaza.geometry.coordinates.push(cafe.geometry.coordinates[0]);

  //Rod's Road
  var roadRadius = utils.feetToMiles(jsonFile.center_camp.rod_road_distance);
  var rodRoad = createArc(centerCampCenter, roadRadius, 'miles', 0, 360, 5);
  rodRoad = turf.linestring(rodRoad.geometry.coordinates[0]);
  rodRoad.properties = {
    "name": "Rod's Road",
    "ref": "rod"
  }

  return turf.featurecollection([cafe,plaza,rodRoad]);
}

function plazasFeatureCollection(jsonFile) {
  var features = []
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;

  var lookupDistance = streetDistanceLookup(jsonFile);
  jsonFile.plazas.map(function(item){
    var distance = item.distance;
    var point;
    if( distance === 0) {
      point = cityCenter;
    } else {
      distance = utils.feetToMiles(distanceFromCenter(lookupDistance,distance));
      var timeArray = utils.splitTimeString(item.time);
      var hour = timeArray[0];
      var minute = timeArray[1];
      var bearing = utils.timeToCompassDegrees(hour,minute,cityBearing);
      point = turf.destination(cityCenter,distance,bearing,'miles');
    }

    var radius = utils.feetToMiles(item.diameter)/2.0;

    var buffer = createArc(point, radius, 'miles', 0, 360, 5);
    buffer.properties = {
      "name":item.name
    }
    features.push(buffer);
  })
  return turf.featurecollection(features);
}

//Creates the time or radial streets based on the jsonFile
function timeStreetsFeatureCollection(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;

  var distanceLookup = streetDistanceLookup(jsonFile);
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

function streetDistanceLookup(jsonFile){
  var distanceLookup = {};
  jsonFile.cStreets.map(function(item){
    distanceLookup[item.ref] = item.distance;
  });
  return distanceLookup;
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

  var fullCircle = false;
  if (endBearing % 360 === startBearing % 360) {
    fullCircle = true;
    endBearing += -1 *bearingFrequency;
  }

  var points = [];

  var currentBearing = startBearing;
  while (bearingCompare(endBearing, currentBearing)) {
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
  if(fullCircle) {
    var currentPoint = turf.destination(center,distance,endBearing+bearingFrequency,units);
    points.push(currentPoint.geometry.coordinates);
    return turf.polygon([points]);
  }

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
