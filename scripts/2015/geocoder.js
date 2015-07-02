
var turf  = require('turf');

var Geocoder = function(centerPoint, cityBearing, hardcodedLocations) {
  this.centerPoint = centerPoint;
  this.cityBearing = cityBearing;
  this.hardcodedLocations = hardcodedLocations;
  this.features = []
};

Geocoder.prototype.addFeatures = function(features) {
  this.features = this.features.concat(features['features']);
}

//units must be 'miles', 'kilometers', 'degrees', 'radians'
Geocoder.prototype.timeDistanceToLatLon = function(time, distance, units) {

  var timeArray = time.split(":");
  var hour = timeArray[0];
  var minute = timeArray[1];

  var clockDegrees = timeToDegrees(hour,minute);
  var compassDegrees = (clockDegrees + this.cityBearing) % 360;
  //Need to convert to -180 to 180 where North is 0
  if (compassDegrees > 180) {
    compassDegrees = compassDegrees - 360;
  }

  var destination = turf.destination(this.centerPoint, distance, compassDegrees, units);
  return destination;
};

Geocoder.prototype.streetIntersectionToLatLon = function(street1, street2) {
  //Todo: Create special case for Rod's Road uses internal clock coordinates ie. Rod's Road & 1:30

  //go through all features and pull out matching items for each name
  var features1 = [];
  var features2 = [];
  var arrayLength = this.features.length;
  for (var i = 0; i < arrayLength; i++) {
    var feature = this.features[i]
    if (feature.properties.Name === street1) {
      features1.push(feature);
    } else if (feature.properties.Name === street2) {
      features2.push(feature)
    }
  }

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

  if (intersections.length === 1) {
    return intersections[0];
  } else if (intersections.length === 0) {
    return undefined;
  }

  return intersecions;
}

function timeToDegrees(hour, minute) {
  return .5*(60*(parseInt(hour)%12)+parseInt(minute))
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
