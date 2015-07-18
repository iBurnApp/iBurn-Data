#! /usr/bin/env node
var turf = require('turf');
var utils = require('./utils.js');
turf.multilinestring = require('turf-multilinestring');
turf.difference = require('turf-difference');
var jsts = require("jsts");

if (!process.argv[2]) {
    console.log('Usage: layout.js [file]');
    process.exit(1);
}

var layoutFile = require(process.argv[2]);

console.log("Creating Streets...")
var s = streets(layoutFile);
console.log("Creating Areas...")
var a = areas(layoutFile);
var out = outline(layoutFile);
console.log("%j",out);

function outline(jsonFile) {
  var s = streets(jsonFile);
  var a = areas(jsonFile);
  var defaultWidth = jsonFile.road_width;

  var outline = a.features[0]
  var reader = new jsts.io.GeoJSONReader();
  var parser = new jsts.io.GeoJSONParser();

  s.features.map(function(item){
    var geo = reader.read(item).geometry;
    var width = defaultWidth;
    if (item.properties.width) {
      width = item.properties.width;
    }
    radius = width/ 2 / 364568.0;
    var params = new jsts.operation.buffer.BufferParameters();
    params.setEndCapStyle(jsts.operation.buffer.BufferParameters.CAP_FLAT);
    var buffer = geo.buffer(radius,params)
    buffer = parser.write(buffer);
    var newBuffer = {
      "type": "Feature",
      "properties": {}
    }
    newBuffer.geometry = buffer;
    outline = turf.union(outline,newBuffer);
  })

  a.features.map(function(item){
    if(item.properties.ref !== 'cafe') {
      outline = turf.union(outline,item);
    }
  })


  return turf.featurecollection([outline]);
}

function areas(jsonFile){
  var plazas = plazasFeatureCollection(layoutFile);
  var portals = portalsFeatureCollection(layoutFile);
  var camp = centerCampPolygons(layoutFile);
  var allAreas = turf.featurecollection(plazas.features.concat(camp.features));

  var newPortals  = [];
  portals.features.map(function(portal){
    var newPortal = portal
    allAreas.features.map(function(other){
      newPortal = turf.difference(newPortal,other);
    })
    newPortals.push(newPortal);
  });

  allAreas.features = allAreas.features.concat(newPortals);

  return allAreas;
}

function streets(jsonFile) {

  var ccStreets = centerCampStreets(jsonFile);
  var cStreets = circleStreetsFeatureCollection(layoutFile);
  var tStreets = timeStreetsFeatureCollection(layoutFile);

  var rr = turf.filter(ccStreets,"ref","rod").features[0];
  var rodPolygon = turf.polygon([rr.geometry.coordinates])

  var features = ccStreets.features

  cStreets.features.map(function(item){
    var newStreet = {
      "type": "Feature"
    }
    newStreet.properties = item.properties;
    newStreet.geometry = cutStreets(item,rodPolygon);

    features.push(newStreet);
  })

  var centerPlazaStreet = turf.filter(ccStreets,"ref","centerCampPlazaRoad").features[0];
  var plazaPolygon = turf.polygon([centerPlazaStreet.geometry.coordinates]);

  tStreets.features.map(function(item){
    var newStreet = {
      "type": "Feature"
    }
    newStreet.properties = item.properties;
    newStreet.geometry = cutStreets(item,plazaPolygon);

    features.push(newStreet);
  })

  return turf.featurecollection(features)

}

function cutStreets(street,polygon) {
  var reader = new jsts.io.GeoJSONReader();
  var a = reader.read(street);
  var b = reader.read(polygon);
  // console.log("%j",b);
  // console.log("%j",b.geometry.getCoordinates());
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

function rodRoad(centerCenterCamp, distance, units) {
  var rodRoad = createArc(centerCenterCamp, distance, units, 0, 360, 5);
  rodRoad = turf.linestring(rodRoad.geometry.coordinates[0]);
  rodRoad.properties = {
    "name": "Rod's Road",
    "ref": "rod"
  }

  return rodRoad
}

function centerCampCenter(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;
  var centerCampDistance = utils.feetToMiles(jsonFile.center_camp.distance);
  var bearing = utils.timeToCompassDegrees("6","0",cityBearing);
  var ccc = turf.destination(cityCenter,centerCampDistance,bearing,'miles');

  return ccc;
}

function centerCampStreets(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;
  var centerCampDistance = utils.feetToMiles(jsonFile.center_camp.distance);
  var bearing = utils.timeToCompassDegrees("6","0",cityBearing);
  var ccc = centerCampCenter(jsonFile);

  //Rod's Road
  var roadRadius = utils.feetToMiles(jsonFile.center_camp.rod_road_distance);
  var rr = rodRoad(ccc,roadRadius,'miles');

  //Plaza road - This is half way between cafe and where the camps start
  var cafeRadius = jsonFile.center_camp.cafe_radius;
  var plazaRadius = jsonFile.center_camp.cafe_plaza_radius;
  var plazaRoadRadius = utils.feetToMiles(cafeRadius+ (plazaRadius-cafeRadius)/2.0);
  var plazaRoad = createArc(ccc, plazaRoadRadius, 'miles', 0, 360, 5);
  plazaRoad = turf.linestring(plazaRoad.geometry.coordinates[0],{
    "ref": "centerCampPlazaRoad"
  });

  //Two roads that go out at about 3:00 & 9:00 to intersect at A Road
  var streets = jsonFile.cStreets.filter(function(item){
    return item.ref === 'a'
  });
  var aInfo = streets[0];
  var distance = utils.feetToMiles(aInfo.distance);
  var aStreet = circleStreet(jsonFile.center,jsonFile.bearing, distance, 'miles', aInfo.segments, aInfo.ref, aInfo.name);

  var points = turf.intersect(aStreet, rr);
  var a1 = turf.linestring([ccc.geometry.coordinates,points.geometry.coordinates[0]],aStreet.properties);
  var a2 = turf.linestring([ccc.geometry.coordinates,points.geometry.coordinates[1]],aStreet.properties);

  //cut roads with plaza road
  var plazaPolygon = turf.polygon([plazaRoad.geometry.coordinates]);

  a1 = turf.linestring(cutStreets(a1,plazaPolygon).coordinates,a1.properties);
  a2 = turf.linestring(cutStreets(a2,plazaPolygon).coordinates,a2.properties);

  //Route 66
  a1Bearing = turf.bearing(turf.point(a1.geometry.coordinates[0]),turf.point(a1.geometry.coordinates[1]));
  a2Bearing = turf.bearing(turf.point(a2.geometry.coordinates[0]),turf.point(a2.geometry.coordinates[1]));

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
  var arc0 = createArc(ccc,ManDistance,'miles',negativeBearing,360,5);
  arc0.geometry.coordinates.pop();
  var arc1 = createArc(ccc,ManDistance,'miles',0,positiveBearing,5);
  arc1.geometry.coordinates = arc0.geometry.coordinates.concat(arc1.geometry.coordinates);

  var sixDistance = utils.feetToMiles(jsonFile.center_camp.six_six_distance.six_facing);
  var arc2 = createArc(ccc,sixDistance,'miles',positiveBearing,negativeBearing,5);

  var portal = turf.filter(portalsFeatureCollection(jsonFile),"ref","6portal").features[0];

  var routeSS = turf.multilinestring([arc1.geometry.coordinates,arc2.geometry.coordinates],{
    "ref":"66",
    "name":"Route 66",
    "width":jsonFile.center_camp.six_six_width
  })

  routeSS = turf.multilinestring(cutStreets(routeSS,portal).coordinates,routeSS.properties);

  return turf.featurecollection([rr, plazaRoad, a1, a2,routeSS]);
}

function portalsFeatureCollection(jsonFile) {
  var cityCenter = jsonFile.center;
  var portalsInfoList = jsonFile.portals;

  var distanceLookup = streetDistanceLookup(jsonFile);

  var circleStreets = circleStreetsFeatureCollection(jsonFile);
  var esplanade = turf.filter(circleStreets,"ref","esplanade").features[0];

  var ccc = centerCampCenter(jsonFile);

  //Rod's Road
  var roadRadius = utils.feetToMiles(jsonFile.center_camp.rod_road_distance);
  var rr = rodRoad(ccc,roadRadius,'miles');

  var features = [];
  portalsInfoList.map(function(item){
    var distance = utils.feetToMiles(distanceFromCenter(distanceLookup,item.distance));
    var units = 'miles';
    var timeString = item.time;
    var timeBearing = utils.timeStringToCompaassDegress(timeString,jsonFile.bearing);
    var angle = item.angle;
    var properties = {
      "name":item.name,
      "ref":item.ref
    };

    var start = turf.destination(cityCenter,distance,timeBearing,units);

    //flip bearing around
    portalBearing = 180 - Math.abs(timeBearing);
    if (timeBearing > 0) {
      portalBearing = portalBearing * -1;
    }

    firstBearing = portalBearing - angle/2;
    secondBearing = portalBearing + angle/2;

    var firstPoint = turf.destination(start,0.5,firstBearing,'miles');
    var secondPoint = turf.destination(start,0.5,secondBearing,'miles');

    var triangle = turf.polygon([[start.geometry.coordinates,firstPoint.geometry.coordinates,secondPoint.geometry.coordinates,start.geometry.coordinates]])

    var reader = new jsts.io.GeoJSONReader();
    var poly = reader.read(triangle);
    var street;
    var result;
    if (timeString === "6:00") {
      //For center camp portal get intersectin of Rod road as polygon and expanded triangle
      street = reader.read(rr);
      result = poly.geometry.intersection(street.geometry.convexHull());
    } else {
      //For all other take convex hull of esplanade (the open playa) and find difference with expanded triangle
      street = reader.read(esplanade);
      result = poly.geometry.difference(street.geometry.convexHull());
    }

    var parser = new jsts.io.GeoJSONParser();
    result = parser.write(result);
    result = turf.polygon(result.coordinates);
    result.properties = properties;
    features.push(result);

  });
  return turf.featurecollection(features);
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
      features.push(turf.multilinestring(lines,{"ref":timeString,"name":timeString,"width":item.width}));
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
