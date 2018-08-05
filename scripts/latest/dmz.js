var streets = require('./streets.js');
var utils = require('./utils.js');
var turf = require('turf');

module.exports.frontArc = function(layout) {
  var dmzInfo = layout.dmz;
  var distance = utils.feetToMiles(dmzInfo.distance)
  var line = streets.circleStreet(layout.center,layout.bearing,distance,'miles',dmzInfo.segments,"dmz","DMZ");
  line.properties.type = "other";
  return turf.linestring(line.geometry.coordinates[0],line.properties);
}

module.exports.area = function(layout) {
  var arc = module.exports.frontArc(layout);
  var properties = arc.properties;
  arc = arc.geometry.coordinates;
  var backArcDistance = utils.feetToMiles(layout.dmz.distance+layout.dmz.depth);
  var backArc = streets.circleStreet(layout.center,layout.bearing,backArcDistance,'miles',layout.dmz.segments,"dmz","DMZ").geometry.coordinates[0];
  var coordinates = arc.concat(backArc.reverse());
  coordinates.push(coordinates[0]);
  return turf.polygon([coordinates],properties);
}

module.exports.toilets = function(layout) {
  var arcDistanceFromMan = utils.feetToMiles(layout.dmz.distance+layout.dmz.depth/2);
  var backArc = streets.circleStreet(layout.center,layout.bearing,arcDistanceFromMan,'miles',layout.dmz.segments,"dmz","DMZ").geometry.coordinates[0];
  var properties = {"ref":"toilet"}
  var toilet1 = turf.point(backArc[0],properties);
  var toilet2 = turf.point(backArc[backArc.length-1],properties);

  return turf.featurecollection([toilet1,toilet2]);

}
