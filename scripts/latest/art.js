var Geocoder = require("./geocoder/geocoder.js");
var fs = require('fs');
var turf = require('turf')

var nopt = require("nopt"),
    Stream = require("stream").Stream,
    path = require("path"),
    knownOpts = {
        "layout": path,
        "file": path,
        "key": String,
        "out": path
    },
    shortHands = {
        "l": ["--layout"],
        "f": ["--file"],
        "o": ["--out"],
        "k": ["--key"]
    },
    parsed = nopt(knownOpts, shortHands, process.argv, 2)

var layout = JSON.parse(fs.readFileSync(parsed.layout, 'utf8'));
var art = JSON.parse(fs.readFileSync(parsed.file, 'utf8'));
var key = parsed.key;

var coder = new Geocoder(layout);

var result = [];
art.map(function(item) {
    if (item[key]) {
        var point = coder.forward(item[key])
        if (point) {
            var lat = point.geometry.coordinates[1];
            var lon = point.geometry.coordinates[0];
            if (typeof lat == "number" &&
                typeof lon == "number") {
                item.location.gps_latitude = lat;
                item.location.gps_longitude = lon;                
            } else {
                console.log('non-number result ' + item.name + ' @ ' + item[key] + ': ' + item.location.gps_latitude + ' /// ' + item.location.gps_longitude)
            }
        } else {
            console.log('could not geocode ' + item.name + ': ' + item[key])
        }
    } else {
        console.log('missing key: ' + item.name)
    }
    result.push(item);
});

if (parsed.out) {
    fs.writeFile(parsed.out, JSON.stringify(result), function(err) {});
} else {
    console.log(JSON.stringify(result));
}