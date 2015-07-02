var test = require('tape');
var turf  = require('turf');
var Geocoder = require('../geocoder.js');

var streets = require('./streets2014.json')

//2014 actual center and bearing
var cityCenter = {
  "type": "Feature",
  "geometry": {"type": "Point", "coordinates": [-119.20315, 40.78880]}
  };

var cityBearingDegrees = 45;

test('TimeAndDistance', function(t) {

  var coder = new Geocoder(cityCenter,cityBearingDegrees);
  var distance = 0.5;
  var unit = 'miles';

  var timeDict = {
    "12:00": 45,
    "3:00" : 135,
    "6:00" : -135,
    "9:00" : -45,
    "10:30": 0,
    "00:00": 45,
    "16:30": 180
  };

  for (time in timeDict) {
    var newPoint = coder.timeDistanceToLatLon(time,distance,unit);
    var calculatedDistance = turf.distance(cityCenter,newPoint, unit);
    var goodEnoughDistance = Math.abs(distance-calculatedDistance) < 0.001;
    var bearing = turf.bearing(cityCenter,newPoint).toFixed(2);
    t.ok(bearing-timeDict[time] === 0,"Should be equal Bearing");
    t.ok(goodEnoughDistance,"Should be equal distance");
  }

  t.end();
});

test ('StreetIntersection', function(t) {

  var coder = new Geocoder(cityCenter,cityBearingDegrees);
  coder.addFeatures(streets);

  var testSearches = [
    turf.point([ -119.214674486961, 40.78016725641976 ],{street1:'6:00',street2:"Holy"}),
    turf.point([ -119.21159929425116, 40.787157193576945 ],{street1:'Esplanade',street2:"7:00"})
  ];

  for (var i =0; i < testSearches.length; i++) {
    var testIntersection = testSearches[i];
    var intersection = coder.streetIntersectionToLatLon(testIntersection.properties.street1,testIntersection.properties.street2);
    var distance = turf.distance(intersection,testIntersection)
    t.ok(distance < 0.001, "Intersection should be close")
  }

  var intersection = coder.streetIntersectionToLatLon("Rod's Rd.","Airstrip");
  console.log(intersection)
  t.end()
});
