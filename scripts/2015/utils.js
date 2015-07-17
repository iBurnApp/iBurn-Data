var turf  = require('turf');

  // -180 to 180
var  timeToCompassDegrees = function(hour, minute, cityBearing) {
    var clockDegrees = .5*(60*(parseInt(hour)%12)+parseInt(minute))
    var compassDegrees = (clockDegrees + cityBearing) % 360;
    //Need to convert to -180 to 180 where North is 0
    if (compassDegrees > 180) {
      compassDegrees = compassDegrees - 360;
    }
    return compassDegrees
  }

var  timeStringToCompaassDegress = function(string,cityBearing) {
    var array = splitTimeString(string);
    return timeToCompassDegrees(array[0],array[1],cityBearing);
  }

var splitTimeString = function(timeString) {
    return timeString.split(":");
  }

var feetToMiles = function(feet) {
    return feet * 0.000189394;
  }


module.exports = {
  timeToCompassDegrees : timeToCompassDegrees,
  timeStringToCompaassDegress : timeStringToCompaassDegress,
  splitTimeString : splitTimeString,
  feetToMiles: feetToMiles
}
