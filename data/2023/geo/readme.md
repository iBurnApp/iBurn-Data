## How to create vector tiles

Before generating the tiles, we need some geojson.

## Handcrafted Layouts

There are handcrafted artisinal scripts for creating the city layout from scratch.

Look in `scripts/BlackRockCityPlanner` README.md. e.g.

```
$ cd iBurn-Data/scripts/BlackRockCityPlanner
$ open README.md
$ node src/cli/generate_all.js -d ../../data/2023
```
repeat for types `streets, polygons, outline, fence`
etc...

## Exporting from OSM

If that doesn't work maybe we can export tiles from OSM if someone else updated the city layout on there. (haven't tried this yet)

* Export `map.osm` from [OpenStreetMap](https://www.openstreetmap.org/export#map=14/40.7830/-119.2066)
* Use [osmtogeojson](https://github.com/tyrasd/osmtogeojson) to convert `map.osm` to `osm.geojson`

```
$ npm install -g osmtogeojson
$ osmtogeojson map.osm > osm.geojson
```

* Some other steps, like creating a new `style.json` from scratch (left as an exercise for the reader)

# Generating Vector Tiles

If you're here you've probably already created the required geojson files.

**Great!**

Next is to take all the geojson files and cram them into vector tiles.

1. Learn about [tippecanoe](https://github.com/mapbox/tippecanoe). **It's Great!**

2. I chose to do things the [docker way](https://github.com/mapbox/tippecanoe#docker-image).

3. Run this command

```bash
  tippecanoe --output=Map/map.mbtiles -f \
  -L fence:geo/fence.geojson \
  -L outline:geo/outline.geojson \
  -L points:geo/points.geojson \
  -L polygons:geo/polygons.geojson \
  -L streets:geo/streets.geojson \
  -L toilets:geo/toilets.geojson \
  -z 14 \
  -Z 4
```

4. Now you have vector tiles which you can upload to Mapbox.
