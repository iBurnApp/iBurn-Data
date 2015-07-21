## 2015 Scripts

### Geo Data generator

#### Install
- `npm install` or `npm install -g`

### Running
`node layout.js -f [layoutfile] -o [outputfile] -t [type]`

or

`layout -f [layoutfile] -o [outputfile] -t [type]`

- layoutfile: path to the layoutfile like ../../data/2015/geo/layout.json
- outputfile: (optional) The output goejson destination
- type: streets, polygons, outine, fence

### Geocoder[WIP]

- Start with city streets and polygons
- Send playa address adn return latitude, longitude