
fs = require('fs');
wiki = require('./wiki.js')
turf = require('turf');

/**
node unofficial.js -w ../../data/2015/unofficial/unofficial-wiki.geojson -p ../../data/2015/camp.json -h ../../data/2015/unofficial/wiki_handcoded.json > ../../data/2015/unofficial/unofficial-wiki_matched.geojson
*/
//var url = 'https://mapsengine.google.com/map/kml?mid=zkszwyFJ-h7E.kaxgaF8gR5Sw&forcekml=1';

var nopt = require("nopt")
  , Stream = require("stream").Stream
  , path = require("path")
  , knownOpts = {
    "wiki" : path,
    'hardcoded' : path,
    "playaEvents": path,
    "out": path
  }
  , shortHands = {
     "w" : ["--wiki"],
     "h" : ["--hardcoded"],
     "p" : ["--playaEvents"],
     "o" : ["--out"]
   }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)

var wikiJSON = parsed.wiki;
var playaEventJSON = parsed.playaEvents;
var hardcodedJSON = parsed.hardcoded;

wikiJSON = fs.readFileSync(wikiJSON, 'utf8')
wikiJSON = JSON.parse(wikiJSON);
playaEventJSON = fs.readFileSync(playaEventJSON, 'utf8');
playaEventJSON = JSON.parse(playaEventJSON);
hardcodedJSON = fs.readFileSync(hardcodedJSON, 'utf8');
hardcodedJSON = JSON.parse(hardcodedJSON);

var total = 0;
var succes = 0;

final = [];

wikiJSON.features.map(function(item){
  wiki.findPlayaEventsId(item, playaEventJSON, hardcodedJSON, function(id, err){
    if (id) {
      succes += 1;
      item.properties.id = id;
      var result = item.properties;
      if (result.Address) {
        result.address = result.Address.replace(/, Black Rock City, NV/, '');
      }

      item.geometry.coordinates = wiki.fixCoordinate(item.geometry.coordinates);
      result.latitude = item.geometry.coordinates[1];
      result.longitude = item.geometry.coordinates[0];
      final.push(result);
    }
    total += 1;
  });
});

if (parsed.out) {
fs.writeFile(parsed.out, JSON.stringify(final), function(err) {});
} else {
  console.log(JSON.stringify(final));
}
