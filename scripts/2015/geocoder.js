
var turf  = require('turf');

var Geocoder = function(centerPoint, cityBearing, centerCamp, hardcodedLocations) {
  this.centerPoint = centerPoint;
  this.centerCamp = centerCamp;
  this.cityBearing = cityBearing;
  this.hardcodedLocations = hardcodedLocations;
  this.features = []
};

Geocoder.prototype.addFeatures = function(features) {
  this.features = this.features.concat(features['features']);
}

//units must be 'miles', 'kilometers', 'degrees', 'radians'
Geocoder.prototype.timeDistanceToLatLon = function(time, distance, units) {

  var timeArray = splitTimeString(time);
  var hour = timeArray[0];
  var minute = timeArray[1];

  var compassDegrees = timeToCompassDegrees(hour,minute, this.cityBearing);


  var destination = turf.destination(this.centerPoint, distance, compassDegrees, units);
  return destination;
};

Geocoder.prototype.streetIntersectionToLatLon = function(street1, street2) {
  //Todo: Create special case for Rod's Road uses internal clock coordinates ie. Rod's Road & 1:30

  var features1 = [];
  var features2 = [];

  var rodString = "Rod's Rd."
  if (street1 === rodString || street2 === rodString) {
    //Rod's Road special clock direction

    var time = splitTimeString(street1);
    if (time.length !== 2) {
      time = splitTimeString(street2);
    }
    var hour = time[0];
    var min = time[1];

    var timeBearing = timeToCompassDegrees(hour,min,this.cityBearing)
    var secondPoint = turf.destination(this.centerCamp, 1, timeBearing, 'miles')
    var radialLine = turf.linestring([this.centerCamp.geometry.coordinates,secondPoint.geometry.coordinates]);
    features1 = this.fuzzyMatchFeatures('Name',rodString);
    features2 = [radialLine];

  } else {
    features1 = this.fuzzyMatchFeatures('Name',street1);
    features2 = this.fuzzyMatchFeatures('Name',street2);
  }

  var intersections = intersectingPoints(features1,features2);

  if (intersections.length === 1) {
    return intersections[0];
  } else if (intersections.length === 0) {
    return undefined;
  }

  return intersecions;
}

Geocoder.prototype.fuzzyMatchFeatures = function(key, value) {
  var arrayLength = this.features.length;
  var features = []
  //go through all features and pull out matching items for each name
  for (var i = 0; i < arrayLength; i++) {
    var feature = this.features[i]
    //Todo: use some sort of fuzzy matching instead of strict ===
    if (feature.properties[key] === value) {
      features.push(feature);
    }
  }
  return features
}

function intersectingPoints(features1,features2) {
  features1Length = features1.length;
  features2Length = features2.length;

  var intersections = []

  //Compare all matching named features with eachother
  for (var i =0; i < features1Length; i++) {
    var feature1 = features1[i];
    for (var j =0; j < features2Length; j++) {
      var feature2 = features2[j];

      var intersection = turf.intersect(feature1,feature2);
      if (typeof intersection !== "undefined") {
        intersections.push(intersection);
      }
    }
  }
  return intersections;
}

// -180 to 180
function timeToCompassDegrees(hour, minute, cityBearing) {
  var clockDegrees = .5*(60*(parseInt(hour)%12)+parseInt(minute))
  var compassDegrees = (clockDegrees + cityBearing) % 360;
  //Need to convert to -180 to 180 where North is 0
  if (compassDegrees > 180) {
    compassDegrees = compassDegrees - 360;
  }
  return compassDegrees
}

function splitTimeString(timeString) {
  return timeString.split(":");
}

function parseLocationString(locationStirng) {
  locationStirng = locationStirng.toLowerCase()
  if (locationStirng in this.hardcodedLocations) {
    return this.hardcodedLocations[locationStirng]
  } else if (true) {

  } else if (true) {

  }
}

module.exports = Geocoder;
