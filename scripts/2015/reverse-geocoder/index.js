var prepare = require('./prepare.js');
var reverseGeocoder = require('./reverse.js');
var layoutFile = require('../../../data/2015/geo/layout.json');


global.prepare = function(callback) {
  var dict = prepare(layoutFile)
  var coder = new reverseGeocoder(dict.center,dict.centerCamp,dict.bearing,dict.polygons,dict.streets);
  return coder;
}

global.reverseGeocode = function(coder,lat,lon) {
  return coder.geocode(lat,lon);
}
