var turf  = require('turf');

//find the two closest points in each line and then draw straight line between them
function connectingLine(line1,line2) {

  line1Points = linePoints(line1);
  line2Points = linePoints(line2);

  var points = nearestPoints(line1Points,line2Points);
  console.log(points)
  var line = turf.linestring([points[0].geometry.coordinates,points[1].geometry.coordinates])
  console.log("calculatedLine")
  return line;
}

//Nearest two points from each collection
function nearestPoints(points1,points2) {
  var nearest1 = turf.point(points1[0])
  var nearest2 = turf.point(points2[0])
  var winningDistance = turf.distance(nearest1, nearest2,'miles')

  for (var i =0; i < points1.length; i++) {
    var point1 = turf.point(points1[i]);
    for (var j =0; j < points2.length; j++) {
      var point2 = turf.point(points2[j]);
      //console.log("Point1: %j",point1);
      //console.log("Point2: %j",point2);
      var distance = turf.distance(point1,point2,'miles');
      console.log(distance)
      if (distance < winningDistance) {
        winningDistance = distance
        nearest1 = point1
        nearest2 = point2
      }
    }
  }

  return [nearest1,nearest2]
}

function linePoints(line) {
  points = []
  var coordinates = line.geometry.coordinates;
  if (line.geometry.type === "MultiLineString") {
    for (var i =0; i < coordinates.length; i++) {
        points = points.concat(linePoints(turf.linestring(coordinates[i]),line.properties));
    }
  } else {
    for (var i =0; i < coordinates.length; i++) {
      var coordinate = coordinates[i];
      points.push(coordinate)
    }
  }

  console.log("Line: %f",line)
  console.log("points: "+points)

  return points;
}

module.exports  = {
  bearing : function(features) {
    filtered = turf.filter(features,"Name","12:00");
    var street = filtered.features[0];
    var coordinates = street.geometry.coordinates;
    var bearing = turf.bearing(turf.point(coordinates[0]),turf.point(coordinates[coordinates.length-1]));

    return Math.round(bearing)%180
  },
  center : function(features) {

    sixFiltered = turf.filter(features,"Name","6:00");
    twelfveFiltered = turf.filter(features,"Name","12:00");

//can't just use first one
    northLine = connectingLine(sixFiltered.features[0],twelfveFiltered.features[0]);

    nineFiltered = turf.filter(features,"Name","9:00");
    threeFiltered = turf.filter(features,"Name","3:00")

    southLine = connectingLine(nineFiltered.features[0],threeFiltered.features[0]);

    console.log("North: %j %f", northLine,turf.lineDistance(northLine,'miles'));
    console.log("South: %j %f", southLine,turf.lineDistance(southLine,'miles'));

    return turf.intersect(northLine,southLine);
  },
  centerCamp: function(features) {
    var filtered = turf.filter(features,"Name","Rod's Rd.");

    var center = turf.centroid(filtered);
    return center
  }
}
