var Geocoder = require("./geocoder/geocoder.js");
var fs = require('fs');
var turf = require('turf')

var nopt = require("nopt")
  , Stream = require("stream").Stream
  , path = require("path")
  , knownOpts = {
    "layout": path,
    "file" : path,
    "key": String,
    "out": path
  }
  , shortHands = {
     "l" : ["--layout"],
     "f" : ["--file"],
     "o" : ["--out"],
     "k" : ["--key"]
   }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)

var layout = JSON.parse(fs.readFileSync(parsed.layout, 'utf8'));
var art = JSON.parse(fs.readFileSync(parsed.file, 'utf8'));
var key = parsed.key;

var coder = new Geocoder(layout);

var result = [];
art.map(function(item){
  if (item[key]) {

    var point = coder.forward(item[key])
    item.latitude = point.geometry.coordinates[1];
    item.longitude = point.geometry.coordinates[0];
    result.push(item);
  }
});

if (parsed.out) {
  fs.writeFile(parsed.out, JSON.stringify(result), function(err) {});
} else {
  console.log(JSON.stringify(result));
}
