var Geocoder = require('./geocoder.js');
var layoutFile = require('../../../data/2015/geo/layout.json');

/**
 * This can take a few seconds to setup all the necessary geo files.
 * It's best to make this once and used multiple times, the internal state
 * doesn't change.
*/
global.prepare = function() {
  return Geocoder(layoutFile);
}

global.reverseGeocode = function(coder, lat, lon) {
  return coder.reverse(lat,lon);
}

global.forwardGeocode = function(coder, locationString) {
  return coder.forward(locationString);
}
