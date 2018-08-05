

module.exports.location = function(playaEvents, unofficialArray, geocoder) {
  var final = [];
  var count = 0;
  for (var key in playaEvents) {
    var playaEventItem = playaEvents[key];

    //get score for playaEventItem
    var playaEventsScore = score(1,null,playaEventItem.location_string)
    var scores = [playaEventsScore];


    unofficialArray.map(function(item){

      var info = item[key];

      if(info){

        var coordinates = null;
        var address = null;
        if (info.latitude) {
          coordinates = [info.longitude,info.latitude];
        }

        if (info.address) {
          address = info.address
        }

        var s = score(0,coordinates,address);
        scores.push(s);
      }
    });

    scores.sort(function(a,b){
      return a.score < b.score;
    })



    var best = scores[0];
    if (best) {

      if (best.coordinates) {
        playaEventItem.latitude = best.coordinates[1];
        playaEventItem.longitude = best.coordinates[0];
        if (!best.address) {
          //reverse-geocode
          playaEventItem.location_string = geocoder.reverse(playaEventItem.latitude,  playaEventItem.longitude);
        }
      }
      else if (best.address) {
        playaEventItem.location_string = best.address;
        if (!best.coordinates) {

          var point = geocoder.forward(playaEventItem.location_string);
          if (point) {

            playaEventItem.latitude = point.geometry.coordinates[1];
            playaEventItem.longitude = point.geometry.coordinates[0];
          }

        }
      }
    }

    if (playaEventItem.location_string && playaEventItem.location_string !== "Unknown" && !playaEventItem.latitude) {
      console.log(playaEventItem.location_string)
    }

    final.push(playaEventItem)
  }
  return final;
}

var score = function(sourceScore, coordinates, address) {
  var final = sourceScore;
  if (coordinates) {
    final += 7;
  }

  if (address) {
    final += 5;
  }

  return {"score":final,"coordinates":coordinates,"address":address}
}
