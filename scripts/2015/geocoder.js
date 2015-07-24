
var turf  = require('turf');
var utils = require('./utils.js');
var Parser = require('./geocodeParser.js')

var Geocoder = function(centerPoint, cityBearing, centerCamp,streets,polygons, hardcodedLocations) {
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
  if (featureName.indexOf("Rod") > -1) {
    start = this.centerCamp;
  }

  var end = turf.destination(start, 5, timeBearing, 'miles');

  var imaginaryTimeStreet = turf.linestring([start.geometry.coordinates,end.geometry.coordinates]);

  var features = this.fuzzyMatchFeatures('name',featureName);

  var intersections = intersectingPoints([imaginaryTimeStreet],features);


  if (intersections.length === 0) {
    return undefined;
  } else {
    return intersections[0];
  }
}

Geocoder.prototype.fuzzyMatchFeatures = function(key, value) {
  var arrayLength = this.features.length;
  var features = []
  //go through all features and pull out matching items for each name
  this.features.map(function(item){
    //Todo: use some sort of fuzzy matching instead of strict ===
    if (item.properties[key] === value) {
      features.push(item);
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

Geocoder.prototype.geocode = function(locationString,callback) {
  if (locationString in this.hardcodedLocations) {
    return this.hardcodedLocations[locationStirng]
  } else {
    var coder = this;
    Parser.parse(locationString, function(time,distance,feature){
      if(distance > 0){

        callback(coder.timeDistanceToLatLon(time,utils.feetToMiles(distance),'miles'))
      } else {
        callback(coder.streetIntersectionToLatLon(time,feature));
      }
    })
  }
}

module.exports = Geocoder;
