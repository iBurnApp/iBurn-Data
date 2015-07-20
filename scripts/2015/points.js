var turf = require('turf');
var utils = require('./utils.js');

exports.centerCampCenter = function(jsonFile) {
  var cityBearing  = jsonFile.bearing;
  var cityCenter = jsonFile.center;
  var centerCampDistance = utils.feetToMiles(jsonFile.center_camp.distance);
  var bearing = utils.timeToCompassDegrees("6","0",cityBearing);
  var ccc = turf.destination(cityCenter,centerCampDistance,bearing,'miles');

  return ccc;
}
