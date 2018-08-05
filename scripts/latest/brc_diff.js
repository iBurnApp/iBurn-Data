#! /usr/bin/env node
/**
 * This file downloads two sets of BRC city data and computes the delta between the golden spike locations.
 * It also creates a polygon from the BRC fence pentagon description in case we ever want to compare
 * that geometry, but on further reflection this can probably be removed as only translation and rotation seem
 * to occur year to year.
 *
 * Created by dbro on 7/31/15.
 */
var parse = require('babyparse');
var request = require('request');
var turf = require('turf');

// Links to PlayaEvents City Data API. We'll extract Golden Spike plus Pentagon Coordinates
// 2014 data
var dataUrl1 = 'http://innovate.burningman.com/wp-content/uploads/2014/06/2014-City-Map-Related-Data.csv';
// 2015 data
var dataUrl2 = 'http://bm-innovate.s3.amazonaws.com/2015/2015-City-Map-Related-Data.csv';

// Get 2014 City data
request(dataUrl1, function (error1, response1, body1) {
  if (!error1 && response1.statusCode == 200) {

    request(dataUrl2, function (error2, response2, body2) {
      if (!error2 && response2.statusCode == 200) {

        //console.log('Data Set 1');
        var parsed1 = parse.parse(body1);
        var goldenSpike1 = extractGoldenSpike(parsed1.data);
        //var pentagon1 = extractPentagon(parsed1.data);

        //console.log('Data Set 2');
        var parsed2 = parse.parse(body2);
        var goldenSpike2 = extractGoldenSpike(parsed2.data);
        //var pentagon2 = extractPentagon(parsed2.data);

        var translation = turf.distance(goldenSpike1, goldenSpike2, 'miles');
        console.log('Golden spike offset ' + translation + ' miles');
        console.log('Golden spike lat delt: ' + (goldenSpike2.geometry.coordinates[1] - goldenSpike1.geometry.coordinates[1]));
        console.log('Golden spike lon delt: ' + (goldenSpike2.geometry.coordinates[0] - goldenSpike1.geometry.coordinates[0]));
      }
    });
  }
});

var extractGoldenSpike = function(parsedData) {

  // Extract 'LAT' from 'GS_LAT'
  var rxPointType = /GS_(...)/;

  // [Lat, Lon]
  var goldenSpike = [];

  for (var row = 0; row < parsedData.length ; row++) {
    var rxPointTypeResult = rxPointType.exec(parsedData[row][0]);
    if (rxPointTypeResult) {
      var isLat = rxPointTypeResult[1] == 'LAT';

      goldenSpike[isLat ? 0 : 1] = parsedData[row][1];
    }
  }
  //console.log(goldenSpike);
  return turf.point(goldenSpike);
};

var extractPentagon = function(parsedData) {

  const NUM_POINTS = 5;

  // Extract '2' from 'P2_LAT' or 'P2_LON'
  var rxPointNumber = /P(.)_L/;
  // Extract 'LAT' from 'P2_LAT'
  var rxPointType = /P._(...)/;

  // Point# -> [Lat, Lon]
  var pointArray = [];

  for (var row = 0; row < parsedData.length ; row++) {
    var rxPointNumberResult = rxPointNumber.exec(parsedData[row][0]);
    if (rxPointNumberResult) {
      var pointNum = rxPointNumberResult[1];
      var rxPointTypeResult = rxPointType.exec(parsedData[row][0]);
      var isLat = rxPointTypeResult[1] == 'LAT';

      var pointIndex = pointNum - 1;
      if (pointArray[pointIndex] === undefined) pointArray[pointIndex] = [];
      pointArray[pointIndex][isLat ? 0 : 1] = parsedData[row][1];
    }
  }
  if (!pointArray.length == NUM_POINTS) {
    console.log('Did not find expected number of points!');
    return undefined;
  }

  console.log(pointArray);
  // turf.polygon requires the polygon ring to be closed. e.g: First and last points must be equal
  pointArray[5] = pointArray[0];
  var pentagon = turf.polygon([pointArray]);
  console.log(pentagon);
  return pentagon;
};