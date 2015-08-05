var prepare = require('./prepare.js');
var reverseGeocoder = require('./reverse.js');
var layoutFile = require('../../../data/2015/geo/layout.json');

prepare(layoutFile, function(cityCenter,centerCampCenter,bearing,polygons,streets){
  var coder = new reverseGeocoder(cityCenter,centerCampCenter,bearing,polygons,streets)

  var result = coder.geocode(40.7873,-119.2101);
  console.log(result);
  result = coder.geocode(40.7931,-119.1978);
  console.log(result);
  result = coder.geocode(40.7808,-119.2140);
  console.log(result);
  result = coder.geocode(40.7807,-119.2132);
  console.log(result);
  result = coder.geocode(40.7901,-119.2199);
  console.log(result);
  result = coder.geocode(40.7826,-119.2132);
  console.log(result);
});
