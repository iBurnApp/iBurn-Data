var turf = require('turf')
var polygons = require('../polygons.js');
var points = require('../points.js');
var streets = require('../streets.js');


module.exports = function(layoutFile,callback) {
  var streetsArea = polygons.streetsArea(layoutFile);

  var innerPlaya = polygons.innerPlaya(layoutFile);

  var outerPlaya = polygons.outerPlaya(layoutFile);

  var centerPolygons = polygons.centerCampPolygons(layoutFile).features;

  var features = [streetsArea,innerPlaya,outerPlaya]
  features = features.concat(centerPolygons);

  var fc = turf.featurecollection(features);

  //Streets without time, airport, entrance
  var s = streets.allStreets(layoutFile);
  var st = s.features.filter(function(item){
    return !(item.properties.type === 'time' || item.properties.ref === 'airport' || item.properties.ref === 'entrance');
  });

  s = turf.featurecollection(st);

  var centerCampCenter = points.centerCampCenter(layoutFile);

  callback(layoutFile.center,centerCampCenter,layoutFile.bearing,fc,s);
}
