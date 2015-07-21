#! /usr/bin/env node
var streets = require('./streets.js');
var polygons = require('./polygons.js');
var fence = require('./fence.js');
var fs = require('fs');

var nopt = require("nopt")
  , Stream = require("stream").Stream
  , path = require("path")
  , knownOpts = {
    "file" : path,
    "out": path,
    "type" : [ "streets", "polygons", "outline", "fence" ],
  }
  , shortHands = {
     "f" : ["--file"],
     "o" : ["--out"],
     "t" : ["--type"]
   }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)

var jsonFile = require(parsed.file);

var output;

switch (parsed.type) {
  case 'streets':
    output = streets.allStreets(jsonFile);
    break;
  case 'polygons':
    output = polygons.allPolygons(jsonFile);
    break;
  case 'outline':
    output = polygons.cityOutline(jsonFile);
    break;
  case 'fence':
    output = fence.fence(jsonFile);
    break;
}

if (parsed.out) {
fs.writeFile(parsed.out, JSON.stringify(output), function(err) {});
} else {
  console.log(JSON.stringify(output));
}
