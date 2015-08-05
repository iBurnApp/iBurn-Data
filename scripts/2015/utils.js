var turf  = require('turf');

  // -180 to 180
var  timeToCompassDegrees = function(hour, minute, cityBearing) {
    var clockDegrees = .5*(60*(parseInt(hour)%12)+parseInt(minute))
    var compassDegrees = (clockDegrees + cityBearing) % 360;
    //Need to convert to -180 to 180 where North is 0
    if (compassDegrees > 180) {
      compassDegrees = compassDegrees - 360;
    }
    return compassDegrees
  }

var  timeStringToCompaassDegress = function(string,cityBearing) {
    var array = splitTimeString(string);
    return timeToCompassDegrees(array[0],array[1],cityBearing);
  }

var splitTimeString = function(timeString) {
    return timeString.split(":");
  }

var degreesToTime = function(degrees,cityBearing) {
  degrees = degrees - cityBearing;
  if (degrees < 0) {
    degrees = degrees + 360;
  }

  var hours = degrees*2/60;
  var minutes = Math.round(hours % 1 * 60)
  //http://stackoverflow.com/questions/8089875/show-a-leading-zero-if-a-number-is-less-than-10
  minutes = (minutes < 10) ? ("0" + minutes) : minutes;

  var hours = Math.floor(hours)
  if (hours === 0 ){
    hours = 12;
  }
  return hours+":"+minutes;
}

var feetToMiles = function(feet) {
    return feet * 0.000189394;
  }

var milesToFeet = function(miles) {
  return miles / 0.000189394
}

var streetDistanceLookup =  function(jsonFile){
    var distanceLookup = {};
    jsonFile.cStreets.map(function(item){
      distanceLookup[item.ref] = item.distance;
    });
    return distanceLookup;
  }
// Bearing [-180, 180] if first bearing is further along clockwise than second bearing
// returns true
function bearingCompare(firstBearing, secondBearing) {
  //convert to [0, 360]
  firstBearing = (firstBearing % 360 + 360) % 360;

  secondBearing = (secondBearing % 360 + 360) % 360;


  return secondBearing < firstBearing;
}

//Bearing [-180, 180]
//Always works clockwise
function createArc(center, distance, units, startBearing, endBearing, bearingFrequency) {

  var fullCircle = endBearing % 360 === startBearing % 360;
  var endsAtZero = endBearing % 360 === 0
  if (endsAtZero || fullCircle) {
    endBearing += -1 *bearingFrequency;
  }

  var points = [];

  var currentBearing = startBearing;
  while (bearingCompare(endBearing, currentBearing)) {
    var currentPoint = turf.destination(center,distance,currentBearing,units);
    points.push(currentPoint.geometry.coordinates);

    currentBearing += bearingFrequency;
    if (currentBearing > 180) {
      currentBearing += -360
    }
  }

  //One more for the end
  var currentPoint = turf.destination(center,distance,endBearing,units);
  points.push(currentPoint.geometry.coordinates);
  if(endsAtZero || fullCircle) {
    var currentPoint = turf.destination(center,distance,endBearing+bearingFrequency,units);
    points.push(currentPoint.geometry.coordinates);
    if (fullCircle){
      return turf.polygon([points]);
    }
  }

  return turf.linestring(points);
}

function cutStreets(street,polygon) {
  var reader = new jsts.io.GeoJSONReader();
  var a = reader.read(street);
  var b = reader.read(polygon);
  // console.log("%j",b);
  // console.log("%j",b.geometry.getCoordinates());
  var diff = a.geometry.difference(b.geometry);
  var parser = new jsts.io.GeoJSONParser();
  diff = parser.write(diff);
  return diff;
}

function distanceFromCenter(lookup, value) {
  if (typeof value === 'string') {
    return lookup[value];
  } else if (typeof value === 'number') {
    return value
  } else {
    return undefined;
  }
}

module.exports = {
  timeToCompassDegrees : timeToCompassDegrees,
  timeStringToCompaassDegress : timeStringToCompaassDegress,
  splitTimeString : splitTimeString,
  degreesToTime : degreesToTime,
  feetToMiles: feetToMiles,
  milesToFeet: milesToFeet,
  streetDistanceLookup: streetDistanceLookup,
  bearingCompare: bearingCompare,
  createArc: createArc,
  cutStreets: cutStreets,
  distanceFromCenter: distanceFromCenter
}
