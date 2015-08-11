var test = require('tape');
var turf  = require('turf');
var Geocoder = require('../geocoder.js');
var Parser = require('../geocodeParser.js')
var s = require('../streets.js');
var p = require('../polygons.js');
var layout2015 = require('./layout2015.json')
var points = require('../points.js')
var prepare = require('../reverse-geocoder/prepare.js');
var reverseGeocoder = require('../reverse-geocoder/reverse.js');

var cityCenter = layout2015.center;

var centerCamp = points.centerCampCenter(layout2015);

var cityBearingDegrees = layout2015.bearing;

var streets = s.allStreets(layout2015);
var polygons = p.allPolygons(layout2015);

test('TimeAndDistance', function(t) {

  var coder = new Geocoder(cityCenter,cityBearingDegrees,centerCamp,streets,polygons);
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

  var coder = new Geocoder(cityCenter,cityBearingDegrees,centerCamp,streets,polygons);
  coder.addFeatures(streets);

  var testSearches = [
    turf.point([ -119.218315, 40.777443 ],{street:"Hankypanky", time:'6:00'}),
    turf.point([ -119.215238, 40.784623 ],{street:'Esplanade',time:"7:00"}),
    turf.point([ -119.215856, 40.779312 ],{street:'Rod\'s Road',time:"6:00"})
  ];

  for (var i =0; i < testSearches.length; i++) {
    var testIntersection = testSearches[i];
    var intersection = coder.streetIntersectionToLatLon(testIntersection.properties.time,testIntersection.properties.street);
    var intersection = coder.geocode(testIntersection.properties.street +' & '+testIntersection.properties.time);
    var distance1 = turf.distance(intersection,testIntersection);
    t.ok(distance1 < 0.001, "Intersection should be close "+distance);

    intersection = coder.geocode(testIntersection.properties.time +' & '+testIntersection.properties.street);
    distance1 = turf.distance(intersection,testIntersection);
    t.ok(distance1 < 0.001, "Intersection should be close "+distance);

    var distance = turf.distance(intersection,testIntersection);
    t.ok(distance < 0.001, "Intersection should be close "+distance);
  }

  t.end()
});

test ('parserTimeDistance', function(t) {
  var artString = "11:55 6600\', Open Playa";
  var result = Parser.parse(artString);
  t.ok(result.time === '11:55' ,"Time string should be equal")
  t.ok(result.distance === 6600, "Distance should be equal")
  t.end();
});

test ('parseStreetTime', function(t) {
  var campString =  "Cinnamon & 5:15"
  var result = Parser.parse(campString);
  t.ok(result.time === '5:15' ,"Time string should be equal")
  t.ok(result.feature === 'Cinnamon', "Street should be equal")
  t.end();
});

test('bulkParse', function(t) {
  var camps = require('../../../data/2014/camps.json')

  var numberOfcamps = camps.length;
  var numberWithTime  = 0;
  var numberMissingTIme = 0;

  camps.map(function(item) {
    var locationString = item.location;
    var result = Parser.parse(locationString);
    if(result.time) {
      numberWithTime += 1;
      var hasSecondary = false;
      if (result.distance || result.feature) {
        hasSecondary = true;
      } else {
        console.log("Missing Secondary: %s",locationString)
      }
    } else {
      console.log("Missing Time: %s",locationString);
      numberMissingTIme += 1;
    }
  });

  t.ok(numberMissingTIme/ numberOfcamps < .05,"95% success rate")
  t.end()

});

test('reverseGeocode',function(t) {
  var dict = prepare(layout2015);
  t.ok(dict.center,"Should have city center");
  t.ok(dict.centerCamp,"Should have center camp center");
  t.ok(dict.bearing, "City should have bearing");
  t.ok(dict.polygons, "Should have polygons");
  t.ok(dict.streets, "Should have streets");
  var coder = new reverseGeocoder(dict.center,dict.centerCamp,dict.bearing,dict.polygons,dict.streets);

  var result = coder.geocode(40.7873,-119.2101);
  t.equal(result,"8:07 & 1686' Inner Playa","Inner Playa test");
  result = coder.geocode(40.7931,-119.1978);
  t.equal(result,"11:59 & 5518' Outer Playa","Outer Playa test");
  result = coder.geocode(40.7808,-119.2140);
  t.equal(result, "Café","Cafe test");
  result = coder.geocode(40.7807,-119.2132);
  t.equal(result, "Center Camp Plaza","Center camp plaza test");
  result = coder.geocode(40.7901,-119.2199);
  t.equal(result, "8:10 & Ersatz","street test")
  result = coder.geocode(40.7826,-119.2132);
  t.equal(result, "11:05 & Rod's Road","rod Road test");
  result = coder.geocode(40.7821, -119.2140);
  t.equal(result, "10:26 & Route 66","route 66 test");
  t.end();
});
