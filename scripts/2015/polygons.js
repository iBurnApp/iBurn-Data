var turf = require('turf');
var utils = require('./utils.js');
turf.multilinestring = require('turf-multilinestring');
turf.difference = require('turf-difference');
var jsts = require("jsts");
var streets = require('./streets.js');
var points = require('./points.js');

exports.plazas = function(jsonFile) {
  var features = []
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;

  var lookupDistance = utils.streetDistanceLookup(jsonFile);
  jsonFile.plazas.map(function(item){
    var distance = item.distance;
    var point;
    if( distance === 0) {
      point = cityCenter;
    } else {
      distance = utils.feetToMiles(utils.distanceFromCenter(lookupDistance,distance));
      var timeArray = utils.splitTimeString(item.time);
      var hour = timeArray[0];
      var minute = timeArray[1];
      var bearing = utils.timeToCompassDegrees(hour,minute,cityBearing);
      point = turf.destination(cityCenter,distance,bearing,'miles');
    }

    var radius = utils.feetToMiles(item.diameter)/2.0;

    var buffer = utils.createArc(point, radius, 'miles', 0, 360, 5);
    buffer.properties = {
      "name":item.name
    }
    features.push(buffer);
  })
  return turf.featurecollection(features);
}

exports.portals = function(jsonFile) {
  var cityCenter = jsonFile.center;
  var portalsInfoList = jsonFile.portals;

  var distanceLookup = utils.streetDistanceLookup(jsonFile);

  var circleStreets = streets.circularStreets(jsonFile);
  var esplanade = turf.filter(circleStreets,"ref","esplanade").features[0];

  var ccc = points.centerCampCenter(jsonFile);

  //Rod's Road
  var roadRadius = utils.feetToMiles(jsonFile.center_camp.rod_road_distance);
  var rr = streets.rodRoad(ccc,roadRadius,'miles');

  var features = [];
  portalsInfoList.map(function(item){
    var distance = utils.feetToMiles(utils.distanceFromCenter(distanceLookup,item.distance));
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

exports.centerCampPolygons = function(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;
  var centerCampDistance = utils.feetToMiles(jsonFile.center_camp.distance);
  var bearing = utils.timeToCompassDegrees("6","0",cityBearing);
  var centerCampCenter = turf.destination(cityCenter,centerCampDistance,bearing,'miles');

  //Cafe
  var cafeRadius = utils.feetToMiles(jsonFile.center_camp.cafe_radius);
  var cafe = utils.createArc(centerCampCenter, cafeRadius, 'miles', 0, 360, 5);
  cafe.properties = {
    "name":"Café",
    "ref":"cafe"
  }

  //Plaza
  var plazaRadius = utils.feetToMiles(jsonFile.center_camp.cafe_plaza_radius);
  var plaza = utils.createArc(centerCampCenter, plazaRadius, 'miles', 0, 360, 5);
  //Create hole for cafe
  plaza.geometry.coordinates.push(cafe.geometry.coordinates[0]);

  return turf.featurecollection([cafe,plaza]);
}

exports.allPolygons = function(jsonFile) {
  var plazas = exports.plazas(jsonFile);
  var portals = exports.portals(jsonFile);
  var camp = exports.centerCampPolygons(jsonFile);
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

exports.streetsOutline = function(jsonFile) {
  var s = streets.allStreets(jsonFile);
  var defaultWidth = jsonFile.road_width;

  var outline;
  var reader = new jsts.io.GeoJSONReader();
  var parser = new jsts.io.GeoJSONParser();

  s.features.map(function(item){
    var geo = reader.read(item).geometry;
    var width = defaultWidth;
    if (item.properties.width) {
      width = item.properties.width;
    }
    radius = width/ 2 / 364568.0;

    var buffer = geo.buffer(radius)
    buffer = parser.write(buffer);
    var newBuffer = {
      "type": "Feature",
      "properties": {}
    }
    newBuffer.geometry = buffer;
    if (outline) {
      outline = turf.union(outline,newBuffer);
    } else {
      outline = newBuffer;
    }

  })

  return outline;
}

exports.cityOutline = function(jsonFile) {

  var outline = exports.streetsOutline(jsonFile);

  var plazas = exports.plazas(jsonFile);
  var portals = exports.portals(jsonFile);
  var camp = exports.centerCampPolygons(jsonFile);
  var a = turf.featurecollection(plazas.features.concat(camp.features));

  var newPortals  = [];
  portals.features.map(function(portal){
    var newPortal = portal
    if (portal.properties.ref === '6portal') {
      a.features.map(function(other){
        newPortal = turf.difference(newPortal,other);
      })
    }

    newPortals.push(newPortal);
  });

  a.features = a.features.concat(newPortals);

  a.features.map(function(item){
    if(item.properties.ref !== 'cafe') {
      outline = turf.union(outline,item);
    }
  })


  return turf.featurecollection([outline]);
}
