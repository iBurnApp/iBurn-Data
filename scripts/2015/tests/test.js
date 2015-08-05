var test = require('tape');
var turf  = require('turf');
var Geocoder = require('../geocoder.js');
var Parser = require('../geocodeParser.js')
var s = require('../streets.js');
var p = require('../polygons.js');
var layout2015 = require('./layout2015.json')
var points = require('../points.js')

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
    coder.geocode(testIntersection.properties.street +' & '+testIntersection.properties.time,function(intsection){
      var distance1 = turf.distance(intsection,testIntersection);
      t.ok(distance1 < 0.001, "Intersection should be close "+distance);
    })

    var distance = turf.distance(intersection,testIntersection);
    t.ok(distance < 0.001, "Intersection should be close "+distance);
  }

  t.end()
});

test ('parserTimeDistance', function(t) {
  var artString = "11:55 6600\', Open Playa";
  Parser.parse(artString,function(tm,dist){
    t.ok(tm === '11:55' ,"Time string should be equal")
    t.ok(dist === 6600, "Distance should be equal")
    t.end();
  });
});

test ('parseStreetTime', function(t) {
  var campString =  "Cinnamon & 5:15"
  Parser.parse(campString,function(tm,dist,street){
    console.log(tm)
    t.ok(tm === '5:15' ,"Time string should be equal")
    t.ok(street === 'Cinnamon', "Street should be equal")
    t.end();
  });
});

test('bulkParse', function(t) {
  var camps = require('../../../data/2014/camps.json')

  var numberOfcamps = camps.length;
  var numberWithTime  = 0;
  var numberMissingTIme = 0;

  camps.map(function(item) {
    var locationString = item.location;
    Parser.parse(locationString,function(tm,dist,street) {
      if(tm) {
        numberWithTime += 1;
        var hasSecondary = false;
        if (dist || street) {
          hasSecondary = true;
        } else {
          console.log("Missing Secondary: %s",locationString)
        }
      } else {
        console.log("Missing Time: %s",locationString);
        numberMissingTIme += 1;
      }
    })
  });

  t.ok(numberMissingTIme/ numberOfcamps < .05,"95% success rate")
  t.end()

})
