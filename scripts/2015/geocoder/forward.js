
var turf  = require('turf');
var utils = require('../utils.js');
var Parser = require('./geocodeParser.js')
var leven = require('levenshtein');

var Geocoder = function(centerPoint, centerCamp, cityBearing, streets, polygons, hardcodedLocations) {
  this.centerPoint = centerPoint;
  this.centerCamp = centerCamp;
  this.cityBearing = cityBearing;
  this.streets = streets;
  this.polygons = polygons;
  this.hardcodedLocations = {};
  if (hardcodedLocations){
    this.hardcodedLocations = hardcodedLocations;
  }
  this.features = []
  this.addFeatures(this.streets);
  this.addFeatures(this.polygons);
};

Geocoder.prototype.addFeatures = function(features) {
  this.features = this.features.concat(features['features']);
}

//units must be 'miles', 'kilometers', 'degrees', 'radians'
Geocoder.prototype.timeDistanceToLatLon = function(time, distance, units) {

  var compassDegrees = utils.timeStringToCompaassDegress(time, this.cityBearing);

  var destination = turf.destination(this.centerPoint, distance, compassDegrees, units);
  return destination;
};

Geocoder.prototype.streetIntersectionToLatLon = function(timeString, featureName) {
  var timeBearing = utils.timeStringToCompaassDegress(timeString,this.cityBearing);
  var start = this.centerPoint;
  if (featureName.indexOf("Rod") > -1 ||featureName.indexOf("Inner") > -1 || featureName.indexOf("66") > -1) {
    start = this.centerCamp;
  }

//Bad hack because when cirucular roads end at the 'intersecting' time street they don't really intersect so we got to fake it by
//trying raidal roads ever so slightly off 1/20 of a degree. 6:30 & B
  var radial = []
  for (var i = 0; i < 3; i++) {

    var bearing = timeBearing+i/20;
    if (i > 1) {
      bearing = timeBearing-1/20;
    }


    var end = turf.destination(start, 5, bearing, 'miles');

    var imaginaryTimeStreet = turf.linestring([start.geometry.coordinates,end.geometry.coordinates]);
    radial.push(imaginaryTimeStreet);
  }


  var features = this.fuzzyMatchFeatures('name',featureName);

  var intersections = intersectingPoints(radial,features);


  if (intersections.length === 0) {
    return undefined;
  } else {
    return intersections[0];
  }
}

Geocoder.prototype.fuzzyMatchFeatures = function(key, value) {
  var features = []
  //go through all features and pull out matching items for each name
  this.features.map(function(item){
    var geoName = item.properties[key];
    if (geoName) {
      var largestNameLength = Math.max(geoName.length, value.length);
      var match = (largestNameLength - new leven(geoName, value).distance) / largestNameLength;
      if (match > 0.6) {
        features.push(item);
      }
    }
  });
  return features
}

function intersectingPoints(features1,features2) {
  features1Length = features1.length;
  features2Length = features2.length;

  var intersections = []

  //Compare all matching named features with eachother
  features1.map(function(item1){
    features2.map(function(item2){
      var intersection = turf.intersect(item1,item2);
      if (typeof intersection !== "undefined") {
        intersections.push(intersection);
      }
    });
  });
  return intersections;
}

Geocoder.prototype.geocode = function(locationString) {
  if (locationString in this.hardcodedLocations) {
    return this.hardcodedLocations[locationStirng]
  } else {
    var coder = this;
    var result = Parser.parse(locationString);
    if(result.distance >= 0){

      return coder.timeDistanceToLatLon(result.time,utils.feetToMiles(result.distance),'miles');
    } else {
      return coder.streetIntersectionToLatLon(result.time,result.feature);
    }
  }
}

module.exports = Geocoder;
