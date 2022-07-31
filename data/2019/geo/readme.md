## How to create vector tiles

If you're here you've probably already created the required geojson files.

**Great!**

Next is to take all the geojson files and cram them into vector tiles.

1. Learn about [tippecanoe](https://github.com/mapbox/tippecanoe). **It's Great!**

2. I chose to do things the [docker way](https://github.com/mapbox/tippecanoe#docker-image).

3. Run this command

```bash
docker run -it --rm \
  -v [PATH TO THIS DIRECTORY]:/data \
  tippecanoe:latest \
  tippecanoe --output=/data/2017.mbtiles -f \
  -L airport:/data/airport.geojson \
  -L entrance_road:/data/entrance_road.geojson \
  -L fence:/data/fence.geojson \
  -L outline:/data/outline.geojson \
  -L points:/data/points.geojson \
  -L polygons:/data/polygons.geojson \
  -L streets:/data/streets.geojson \
  -L toilets:/data/toilets.geojson \
  -z 14 \
  -Z 4
```

4. Now you have vector tiles which you can upload to Mapbox.