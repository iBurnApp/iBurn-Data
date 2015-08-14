var turf = require('turf');
var utils = require('../utils.js');

var reverseGeocoder = function(cityCenter,centerCampCenter,cityBearing,polygons,streets) {
  this.cityCenter = cityCenter;
  this.centerCampCenter = centerCampCenter;
  this.cityBearing = cityBearing;
  this.streets = streets.features;
  this.centerPlaza = turf.filter(polygons,'ref','centerPlaza').features[0];
  this.cafe = turf.filter(polygons,'ref','cafe').features[0];
  this.innerPlaya = turf.filter(polygons,'ref','innerPlaya').features[0];
  this.outerPlaya = turf.filter(polygons,'ref','outerPlaya').features[0];
  this.streetsArea = turf.filter(polygons,'ref','streets').features[0];
};

reverseGeocoder.prototype.geocode = function(lat, lon) {
  var point = turf.point([lon, lat]);

  if (turf.inside(point,this.centerPlaza)) {
    return this.centerPlaza.properties.name;
  } else if (turf.inside(point,this.cafe)){
    return this.cafe.properties.name;
  } else if (turf.inside(point,this.innerPlaya)) {
    return this.playaResult(point,this.innerPlaya);

  } else if (turf.inside(point,this.outerPlaya)) {
    return this.playaResult(point,this.outerPlaya);
  } else if (turf.inside(point,this.streetsArea)) {
    var result = streetResult(point,this.streets);
    var time = this.timeForStreet(result.point,result.street);
    return time + ' & ' + result.street.properties.name;
  } else {
    return 'Outside Black Rock City';
  }
};

reverseGeocoder.prototype.timeForStreet = function(point,street) {
  var center = this.cityCenter;
  if (street.properties.ref === '66' || street.properties.ref === 'rod' || street.properties.ref === 'centerCampPlazaRoad') {
    center = this.centerCampCenter
  }

  var bearing = turf.bearing(center,point);
  var time = utils.degreesToTime(bearing,this.cityBearing);
  return time;
}

var streetResult = function(point,features) {
  var bestDistance = Number.MAX_VALUE;
  var winner = {};
  features.map(function(item){
    var result = {};
    result.street = item;
    if(item.geometry.type === 'MultiLineString') {
      var linesList = [];
      item.geometry.coordinates.map(function(coords){
        var line = turf.linestring(coords,item.properties);
        linesList.push(line);
      });
      result = streetResult(point,linesList);
    }

    if (!result.point) {
      result.point = turf.pointOnLine(result.street,point)
    }

    if (result.point.properties.dist < bestDistance) {
      winner = result;
      bestDistance = winner.point.properties.dist;
    }

  });
  return winner;
};

reverseGeocoder.prototype.playaResult = function(point, polygon) {
  var bearing = turf.bearing(this.cityCenter,point);
  var time = utils.degreesToTime(bearing,this.cityBearing);
  var distance = turf.distance(point,this.cityCenter);
  var feet = utils.milesToFeet(distance);

  return time +" & "+ Math.round(feet) +'\' ' + polygon.properties.name;
};

module.exports = reverseGeocoder;
