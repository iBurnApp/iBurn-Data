var turf  = require('turf');

module.exports  = {
  // -180 to 180
  timeToCompassDegrees: function(hour, minute, cityBearing) {
    var clockDegrees = .5*(60*(parseInt(hour)%12)+parseInt(minute))
    var compassDegrees = (clockDegrees + cityBearing) % 360;
    //Need to convert to -180 to 180 where North is 0
    if (compassDegrees > 180) {
      compassDegrees = compassDegrees - 360;
    }
    return compassDegrees
  },
  splitTimeString: function(timeString) {
    return timeString.split(":");
  },
  feetToMiles: function(feet) {
    return feet * 0.000189394;
  }
}
