var turf = require('turf');
var utils = require('./utils.js');
turf.multilinestring = require('turf-multilinestring');
turf.difference = require('turf-difference');
var jsts = require("jsts");
var points = require('./points.js');
var polygons = require('./polygons.js');

exports.circularStreets = function(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;

  var circleStreetsFeatures = []

  jsonFile.cStreets.map( function(item){
    var distance = utils.feetToMiles(item.distance);
    var units = 'miles';

    var multiLineString = circleStreet(cityCenter,cityBearing ,distance,units,item.segments,item.ref,item.name);

    circleStreetsFeatures.push(multiLineString);
  });

  return turf.featurecollection(circleStreetsFeatures);
}

exports.radialStreets = function(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;

  var distanceLookup = utils.streetDistanceLookup(jsonFile);
  var features = [];
  jsonFile.tStreets.map(function(item){

    item.refs.map(function(timeString){
      var lines = [];
      var timeArray = utils.splitTimeString(timeString);
      var hour = timeArray[0];
      var minute = timeArray[1];
      var bearing = utils.timeToCompassDegrees(hour,minute,cityBearing);
      item.segments.map(function(segment){
        var start = utils.feetToMiles(utils.distanceFromCenter(distanceLookup,segment[0]));
        var end = utils.feetToMiles(utils.distanceFromCenter(distanceLookup,segment[1]));

        var startPoint = turf.destination(cityCenter,start,bearing,'miles');
        var endPoint = turf.destination(cityCenter,end,bearing,'miles');

        lines.push([startPoint.geometry.coordinates,endPoint.geometry.coordinates]);
      })
      features.push(turf.multilinestring(lines,{"ref":timeString,"name":timeString,"width":item.width}));
    });

  });
  return turf.featurecollection(features);
}

exports.rodRoad = function(centerCenterCamp, distance, units) {
  var rodRoad = utils.createArc(centerCenterCamp, distance, units, 0, 360, 5);
  rodRoad = turf.linestring(rodRoad.geometry.coordinates[0]);
  rodRoad.properties = {
    "name": "Rod's Road",
    "ref": "rod"
  }

  return rodRoad
}

exports.centerCampStreets = function(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;
  var centerCampDistance = utils.feetToMiles(jsonFile.center_camp.distance);
  var bearing = utils.timeToCompassDegrees("6","0",cityBearing);
  var ccc = points.centerCampCenter(jsonFile);

  //Rod's Road
  var roadRadius = utils.feetToMiles(jsonFile.center_camp.rod_road_distance);
  var rr = exports.rodRoad(ccc,roadRadius,'miles');

  //Plaza road - This is half way between cafe and where the camps start
  var cafeRadius = jsonFile.center_camp.cafe_radius;
  var plazaRadius = jsonFile.center_camp.cafe_plaza_radius;
  var plazaRoadRadius = utils.feetToMiles(cafeRadius+ (plazaRadius-cafeRadius)/2.0);
  var plazaRoad = utils.createArc(ccc, plazaRoadRadius, 'miles', 0, 360, 5);
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

  var pts = turf.intersect(aStreet, rr);
  var a1 = turf.linestring([ccc.geometry.coordinates,pts.geometry.coordinates[0]],aStreet.properties);
  var a2 = turf.linestring([ccc.geometry.coordinates,pts.geometry.coordinates[1]],aStreet.properties);

  //cut roads with plaza road
  var plazaPolygon = turf.polygon([plazaRoad.geometry.coordinates]);

  a1 = turf.linestring(utils.cutStreets(a1,plazaPolygon).coordinates,a1.properties);
  a2 = turf.linestring(utils.cutStreets(a2,plazaPolygon).coordinates,a2.properties);

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
  var arc0 = utils.createArc(ccc,ManDistance,'miles',negativeBearing,360,5);
  arc0.geometry.coordinates.pop();
  var arc1 = utils.createArc(ccc,ManDistance,'miles',0,positiveBearing,5);
  arc1.geometry.coordinates = arc0.geometry.coordinates.concat(arc1.geometry.coordinates);

  var sixDistance = utils.feetToMiles(jsonFile.center_camp.six_six_distance.six_facing);
  var arc2 = utils.createArc(ccc,sixDistance,'miles',positiveBearing,negativeBearing,5);

  var portal = turf.filter(polygons.portals(jsonFile),"ref","6portal").features[0];

  var routeSS = turf.multilinestring([arc1.geometry.coordinates,arc2.geometry.coordinates],{
    "ref":"66",
    "name":"Route 66",
    "width":jsonFile.center_camp.six_six_width
  })

  routeSS = turf.multilinestring(utils.cutStreets(routeSS,portal).coordinates,routeSS.properties);

  return turf.featurecollection([rr, plazaRoad, a1, a2,routeSS]);
}

exports.allStreets = function(jsonFile) {
  var ccStreets = exports.centerCampStreets(jsonFile);
  var cStreets = exports.circularStreets(jsonFile);
  var tStreets = exports.radialStreets(jsonFile);

  var rr = turf.filter(ccStreets,"ref","rod").features[0];
  var rodPolygon = turf.polygon([rr.geometry.coordinates])

  var features = ccStreets.features

  cStreets.features.map(function(item){
    var newStreet = {
      "type": "Feature"
    }
    newStreet.properties = item.properties;
    newStreet.geometry = utils.cutStreets(item,rodPolygon);

    features.push(newStreet);
  })

  var centerPlazaStreet = turf.filter(ccStreets,"ref","centerCampPlazaRoad").features[0];
  var plazaPolygon = turf.polygon([centerPlazaStreet.geometry.coordinates]);

  tStreets.features.map(function(item){
    var newStreet = {
      "type": "Feature"
    }
    newStreet.properties = item.properties;
    newStreet.geometry = utils.cutStreets(item,plazaPolygon);

    features.push(newStreet);
  })

  return turf.featurecollection(features)
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
    var arc = utils.createArc(cityCenter,distance,units,startBearing,endBearing,5)
    multiLineString.geometry.coordinates.push(arc.geometry.coordinates);
  });

  return multiLineString;
}
