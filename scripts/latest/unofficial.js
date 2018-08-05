var fs = require('fs');
var combine = require('./combine.js');
var points = require('./points.js');
var Geocoder = require('./geocoder/geocoder.js');
var s = require('./streets.js');
var p = require('./polygons.js');

var nopt = require("nopt")
  , Stream = require("stream").Stream
  , path = require("path")
  , knownOpts = {
    "playaEvents" : path,
    "unofficial": [path, Array],
    "layout": path,
    'out':path
  }
  , shortHands = {
     "p" : ["--playaEvents"],
     "u" : ["--unofficial"],
     "l" : ["--layout"],
     "o" : ["--out"]
   }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2);

var layout = JSON.parse(fs.readFileSync(parsed.layout, 'utf8'));
var coder = new Geocoder(layout);

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


var result = combine.location(playaEventDict, unofficialList,coder);
if (parsed.out) {
fs.writeFile(parsed.out, JSON.stringify(result,null, 2), function(err) {});
} else {
  console.log(JSON.stringify(result));
}
