var polygons = require('../polygons.js');

var layoutFile = require('../../../data/2015/geo/layout.json');

var streetsArea = polygons.streetsArea(layoutFile);

var innerPlaya = polygons.innerPlaya(layoutFile);

var outerPlaya = polygons.outerPlaya(layoutFile);

console.log("%j",streetsArea);
