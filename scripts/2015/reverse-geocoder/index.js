var prepare = require('./prepare.js');
var reverseGeocoder = require('./reverse.js');
var layoutFile = require('../../../data/2015/geo/layout.json');


global.prepare = function(callback) {
  prepare(layoutFile, function(cityCenter,centerCampCenter,bearing,polygons,streets){
    var coder = new reverseGeocoder(cityCenter,centerCampCenter,bearing,polygons,streets)
    callback(coder);
  });
}

global.reverseGeocode = function(coder,lat,lon) {
  return coder.geocode(lat,lon);
}
