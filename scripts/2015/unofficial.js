var fs = require('fs');
var combine = require('./combine.js');
var points = require('./points.js');
var Geocoder = require('./geocoder.js');
var prepare = require('./reverse-geocoder/prepare.js');
var reverseGeocoder = require('./reverse-geocoder/reverse.js');
var s = require('./streets.js');
var p = require('./polygons.js');

var nopt = require("nopt")
  , Stream = require("stream").Stream
  , path = require("path")
  , knownOpts = {
    "playaEvents" : path,
    "unofficial": [path, Array],
    "layout": path
  }
  , shortHands = {
     "p" : ["--playaEvents"],
     "u" : ["--unofficial"],
     "l" : ["--layout"]
   }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2);

var layout = JSON.parse(fs.readFileSync(parsed.layout, 'utf8'));
var dict = prepare(layout);
var reverseCoder = new reverseGeocoder(dict.center,dict.centerCamp,dict.bearing,dict.polygons,dict.streets);

var cityCenter = layout.center;

var centerCamp = points.centerCampCenter(layout);

var cityBearingDegrees = layout.bearing;

var streets = s.allStreets(layout);
var polygons = p.allPolygons(layout);
var coder = new Geocoder(cityCenter,cityBearingDegrees,centerCamp,streets,polygons);

var createIdDictionary = function(array) {
  var dict = {};
  array.forEach(function(item){
    if (item.id) {
      dict[String(item.id)] = item;
    }
  });
  return dict;
};

var playaEventJSON = parsed.playaEvents;

playaEventJSON = fs.readFileSync(playaEventJSON, 'utf8')
playaEventJSON = JSON.parse(playaEventJSON);

var playaEventDict = createIdDictionary(playaEventJSON);

var unofficialList = [];

parsed.unofficial.map(function(item){

  var unofficialJSON = item;

  unofficialJSON = fs.readFileSync(unofficialJSON, 'utf8')
  unofficialJSON = JSON.parse(unofficialJSON);
  var dict = createIdDictionary(unofficialJSON);
  unofficialList.push(dict)
});


var result = combine.location(playaEventDict, unofficialList,coder,reverseCoder);
console.log(JSON.stringify(result, null, 4));
