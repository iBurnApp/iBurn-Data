

/**
 This parses the location string into it seperate pieces
 timeString eg 12:00 11:43
 feet is number from the format 100'
 feature is either a street, plaza or portal,

 @param string The string to be parsed
 @param callback a function with 3 parameters: timeString, feet, feature
 @return
 */
module.exports.parse = function(string) {
  if (!string) {
    return;
  }
  string = string.trim()
  string = string.toLowerCase()
  //Time Regex 12:00
  var timeRegEx = new RegExp("([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]");
  //Distance regex 100'
  var feetRegEx = new RegExp("[0-9]*(?=')");
  //featureRegEx captures streets A-L Rod's road and plazas when they begin the string and are followed by ' &' or are at the end
  var featureRegEx = new RegExp("(^[a-l|rod|p|center].*)|(^.*[plaza|portal].*$)");

  var split = string.split(/(?: @|&)/);
  if (split.length > 1) {
    var result = {};
    split.map(function(item){
      var newResult = module.exports.parse(item.trim());
      if (newResult.time) {
        result.time = newResult.time;
      }

      if (newResult.distance >- 0) {
        result.distance = newResult.distance;
      }

      if (newResult.feature) {
        result.feature = newResult.feature
      }
    });
    return result;
  } else {
    var timeString;
    var timeArray = timeRegEx.exec(string);
    if (timeArray != null && timeArray.length > 0) {
      timeString = timeArray[0];
    }

    var feet = -1;
    var feetArray = feetRegEx.exec(string);
    if (feetArray != null && feetArray.length > 0) {
      if (feetArray[0].length > 0) {
        feet = Number(feetArray[0]);
      }
    }

    var featureArray = featureRegEx.exec(string)
    var feature;
    if (featureArray != null && featureArray.length > 0) {
      feature = featureArray[0];
    }

    var result = {"time":timeString,"distance":feet,"feature":feature};
    return result;
  }


}
