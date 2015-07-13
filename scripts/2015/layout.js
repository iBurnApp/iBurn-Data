#! /usr/bin/env node
var turf = require('turf');
var utils = require('./utils.js');
turf.multilinestring = require('turf-multilinestring');
var jsts = require("jsts");

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
var centerCampStreets = centerCampStreets(layoutFile);
allStreets.features = allStreets.features.concat(centerCampStreets.features)
console.log("%j",centerCampStreets);

// var road = rodRoad(layoutFile);
// road.geometry.type = "Polygon"
// road.geometry.coordinates = [road.geometry.coordinates];
// var esp = turf.filter(circleStreets,"ref","esplanade").features[0];
// esp.geometry.type = "LineString"
// esp.geometry.coordinates = esp.geometry.coordinates[0]
// console.log("%j",esp);
//
// console.log("%j",cutStreets(esp,road));

function cutStreets(street,polygon) {
  var reader = new jsts.io.GeoJSONReader();
  var a = reader.read(street);
  var b = reader.read(polygon);
  console.log("%j",a);
  console.log("%j",a.geometry.getCoordinates());
  var diff = a.geometry.difference(b.geometry);
  var parser = new jsts.io.GeoJSONParser();
  diff = parser.write(diff);
  return diff;
}

function centerCampPolygons(jsonFile){
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

  return turf.featurecollection([cafe,plaza]);
}

function centerCampStreets(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;
  var centerCampDistance = utils.feetToMiles(jsonFile.center_camp.distance);
  var bearing = utils.timeToCompassDegrees("6","0",cityBearing);
  var centerCampCenter = turf.destination(cityCenter,centerCampDistance,bearing,'miles');

  //Rod's Road
  var roadRadius = utils.feetToMiles(jsonFile.center_camp.rod_road_distance);
  var rodRoad = createArc(centerCampCenter, roadRadius, 'miles', 0, 360, 5);
  rodRoad = turf.linestring(rodRoad.geometry.coordinates[0]);
  rodRoad.properties = {
    "name": "Rod's Road",
    "ref": "rod"
  }

  //Plaza road - This is half way between cafe and where the camps start
  var cafeRadius = jsonFile.center_camp.cafe_radius;
  var plazaRadius = jsonFile.center_camp.cafe_plaza_radius;
  var plazaRoadRadius = utils.feetToMiles(cafeRadius+ (plazaRadius-cafeRadius)/2.0);
  var plazaRoad = createArc(centerCampCenter, plazaRoadRadius, 'miles', 0, 360, 5);
  plazaRoad = turf.linestring(plazaRoad.geometry.coordinates[0]),{
    "ref": "centerCampPlazaRoad"
  };

  //Two roads that go out at about 3:00 & 9:00 to intersect at A Road
  var streets = jsonFile.cStreets.filter(function(item){
    return item.ref === 'a'
  });
  var aInfo = streets[0];
  var distance = utils.feetToMiles(aInfo.distance);
  var aStreet = circleStreet(jsonFile.center,jsonFile.bearing, distance, 'miles', aInfo.segments, aInfo.ref, aInfo.name);

  var points = turf.intersect(aStreet, rodRoad);
  var a1 = turf.linestring([centerCampCenter.geometry.coordinates,points.geometry.coordinates[0]],aStreet.properties);
  var a2 = turf.linestring([centerCampCenter.geometry.coordinates,points.geometry.coordinates[1]],aStreet.properties);

  //Route 66
  a1Bearing = turf.bearing(turf.point(a1.geometry.coordinates[0]),turf.point(a1.geometry.coordinates[1]));
  a2Bearing = turf.bearing(turf.point(a2.geometry.coordinates[0]),turf.point(a2.geometry.coordinates[1]));
  console.log("a1 ",a1Bearing);
  console.log("a2 ",a2Bearing);

  var negativeBearing;
  var positiveBearing;
  if(a1Bearing < 0) {
    negativeBearing = 360 + a1Bearing;
    positiveBearing = a2Bearing;
  } else {
    negativeBearing = 360 + a2Bearing;
    positiveBearing = a1Bearing;
  }

  var ManDistance = utils.feetToMiles(jsonFile.center_camp.six_six_distance.man_facing);
  var arc0 = createArc(centerCampCenter,ManDistance,'miles',negativeBearing,360,5);
  arc0.geometry.coordinates.pop();
  var arc1 = createArc(centerCampCenter,ManDistance,'miles',0,positiveBearing,5);
  console.log("Pos ",positiveBearing);
  console.log("Neg ",negativeBearing);
  console.log("arc0: %j",arc0)
  arc1.geometry.coordinates = arc0.geometry.coordinates.concat(arc1.geometry.coordinates);

  var sixDistance = utils.feetToMiles(jsonFile.center_camp.six_six_distance.six_facing);
  var arc2 = createArc(centerCampCenter,sixDistance,'miles',positiveBearing,negativeBearing,5);
  // console.log("Pos ",positiveBearing);
  // console.log("Neg ",negativeBearing);
  // console.log("arc2: %j",arc2)

  var routeSS = turf.multilinestring([arc1.geometry.coordinates,arc2.geometry.coordinates],{
    "ref":"66"
  })

  return turf.featurecollection([rodRoad, plazaRoad, a1, a2,routeSS]);
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

    var multiLineString = circleStreet(cityCenter,cityBearing ,distance,units,item.segments,item.ref,item.name);

    circleStreetsFeatures.push(multiLineString);
  });

  return turf.featurecollection(circleStreetsFeatures);
}

//Takes in cStreet item keys: distance, segments, ref, name, city_center, units
//returns multiLineString
function circleStreet(cityCenter, cityBearing, distance, units, segments, ref, name) {

  var properties = {
    "ref":ref,
    "name":name,
  };
  var multiLineString = turf.multilinestring([],properties);
  var segments = segments;
  segments.map( function(segment){
    var splitStartTime = utils.splitTimeString(segment[0]);
    var splitEndTime = utils.splitTimeString(segment[1]);
    var startBearing = utils.timeToCompassDegrees(splitStartTime[0],splitEndTime[1],cityBearing);
    var endBearing = utils.timeToCompassDegrees(splitEndTime[0],splitEndTime[1],cityBearing);
    var arc = createArc(cityCenter,distance,units,startBearing,endBearing,5)
    multiLineString.geometry.coordinates.push(arc.geometry.coordinates);
  });

  return multiLineString;
}

//Bearing [-180, 180]
//Always works clockwise
function createArc(center, distance, units, startBearing, endBearing, bearingFrequency) {

  var fullCircle = endBearing % 360 === startBearing % 360;
  var endsAtZero = endBearing % 360 === 0
  if (endsAtZero || fullCircle) {
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
  if(endsAtZero || fullCircle) {
    var currentPoint = turf.destination(center,distance,endBearing+bearingFrequency,units);
    points.push(currentPoint.geometry.coordinates);
    if (fullCircle){
      return turf.polygon([points]);
    }
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
