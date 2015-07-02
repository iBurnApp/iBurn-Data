var test = require('tape');
var turf  = require('turf');
var Geocoder = require('./geocoder.js');

//2014 actual center and bearing
var cityCenter = {
  "type": "Feature",
  "geometry": {"type": "Point", "coordinates": [-119.20315, 40.78880]}
  };

var cityBearingDegrees = 45;

test('TimeAndDistance', function(t) {

  var coder = new Geocoder(cityCenter,cityBearingDegrees)
  var distance = 0.5
  var unit = 'miles'

  var timeDict = {
    "12:00": 45,
    "3:00" : 135,
    "6:00" : -135,
    "9:00" : -45,
    "10:30": 0,
    "00:00": 45,
    "16:30": 180
  }

  for (time in timeDict) {
    var newPoint = coder.toLatLon(time,distance,unit)
    var calculatedDistance = turf.distance(cityCenter,newPoint, unit)
    var goodEnoughDistance = Math.abs(distance-calculatedDistance) < 0.001
    var bearing = turf.bearing(cityCenter,newPoint).toFixed(2)
    t.ok(bearing-timeDict[time] === 0,"Should be equal Bearing")
    t.ok(goodEnoughDistance,"Should be equal distance")
  }

  console.log(coder.toLatLon("5:55",.227273,'miles'))

  t.end();
});
