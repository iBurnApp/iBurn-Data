
var turf  = require('turf');

var Geocoder = function(centerPoint, cityBearing, hardcodedLocations) {
  this.centerPoint = centerPoint;
  this.cityBearing = cityBearing;
  this.hardcodedLocations = hardcodedLocations;
};

//units must be 'miles', 'kilometers', 'degrees', 'radians'
Geocoder.prototype.toLatLon = function(time, distance, units) {

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
