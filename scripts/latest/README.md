## 2015 Scripts

### Geo Data Generator

`npm install` or `npm install -g`

`node layout.js -f [layoutfile] -o [outputfile] -t [type]`

or

`layout -f [layoutfile] -o [outputfile] -t [type]`

- layoutfile: path to the layoutfile like ../../data/2015/geo/layout.json
- outputfile: (optional) The output goejson destination
- type: streets, polygons, outline, fence

### Preparing Unofficial Map

The goal here is to take the names from the Unofficial Map and get the PlayaEvents Camp `id`. And then get the results of the matching into a usable format.

`node match.js -w [wiki file path (geojson from the kml)] -h [hardcoded name lookup file path] -p [PlayaEvents API JSON file path] -o [path to output file]`

### Preparing BurnerMap

Need to manually manipulate the JSON keys to match what is expected. Similar to
PlayaEvents Camps keys, `name, address, id`. There also may be some other manual changes to get the street names closer to what is in the layout.json.

### Merging Data Sources

After the two unofficial are prepared they can be merged with PlayaEvents Camp JSON.

`node unofficial.js -p [PlayaEvents JSON file path] -l [Layout file path] -u [first unofficial prepared source file path] -u [second unofficial prepared source file path] -o [output file path]`

### [Geocoder](geocoder/readme.md)
