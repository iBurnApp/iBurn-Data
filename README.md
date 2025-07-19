# iBurn-Data

Data repository for the iBurn iOS application, containing yearly festival datasets, geospatial data, and processing scripts for Burning Man events. This repository serves as a Swift Package providing offline map tiles, art installation data, camp information, events, and Black Rock City layout geometry.

## Quick Start

### Swift Package Manager Integration
This repository is structured as a Swift Package with yearly data targets:

```swift
// In your Package.swift
dependencies: [
    .package(url: "https://github.com/Burning-Man-Earth/iBurn-Data.git", from: "1.0.0")
]
```

### Available Targets
- `iBurn2025APIData` - JSON data files (art, camps, events, points, updates)
- `iBurn2025Map` - Map tiles, styles, and glyphs for offline rendering
- `iBurn2025MediaFiles` - Images and media assets for art installations and camps

## Data Processing Workflow

### 1. Generate City Geometry
Create the geometric foundation of Black Rock City using BlackRockCityPlanner:

```bash
cd scripts/BlackRockCityPlanner
npm install

# Generate all geometric data for the year
node src/cli/generate_all.js -d ../../data/2025

# This creates:
# - data/2025/geo/streets.geojson (radial time-based streets)
# - data/2025/geo/polygons.geojson (plazas and districts)
# - data/2025/geo/fence.geojson (perimeter boundary)
# - data/2025/geo/outline.geojson (city outline)
# - data/2025/geo/toilets.geojson (facility locations)
```

### 2. Geocode API Data
Add coordinates to camps, art, and events using the generated layout:

```bash
# Geocode camps with coordinates
node src/cli/api.js -l ../../data/2025/layouts/layout.json -f ../../data/2025/APIData/Resources/camp.json -k location_string -o ../../data/2025/APIData/Resources/camp-location.json

# Replace original with geocoded version
mv ../../data/2025/APIData/Resources/camp-location.json ../../data/2025/APIData/Resources/camp.json

# Repeat for art and events as needed
```

### 3. Generate Vector Tiles
Convert GeoJSON files to vector tiles for efficient mobile rendering:

```bash
# Install tippecanoe (macOS)
brew install tippecanoe

# Generate vector tiles from all GeoJSON files
tippecanoe --output=data/2025/Map/Resources/map.mbtiles -f \
  -L fence:data/2025/geo/fence.geojson \
  -L outline:data/2025/geo/outline.geojson \
  -L polygons:data/2025/geo/polygons.geojson \
  -L streets:data/2025/geo/streets.geojson \
  -L toilets:data/2025/geo/toilets.geojson \
  -L dmz:data/2025/geo/dmz.geojson \
  -z 14 \
  -Z 4 \
  -B0
  
# Generate vector tiles from official BMorg data set
tippecanoe --output=Map/Map.bundle/map.mbtiles -f \
  -L fence:../../bmorg/innovate-GIS-data/2025/GeoJSON/trash_fence.geojson \
  -L outline:../../bmorg/innovate-GIS-data/2025/GeoJSON/street_outlines.geojson \
  -L points:../../bmorg/innovate-GIS-data/2025/GeoJSON/cpns.geojson \
  -L blocks:../../bmorg/innovate-GIS-data/2025/GeoJSON/city_blocks.geojson \
  -L plazas:../../bmorg/innovate-GIS-data/2025/GeoJSON/plazas.geojson \
  -L streets:../../bmorg/innovate-GIS-data/2025/GeoJSON/street_lines.geojson \
  -L toilets:geo/toilets.geojson \
  -L dmz:geo/dmz.geojson \
  -z 14 \
  -Z 4 \
  -B0
```


### 4. Create Browser Geocoder
Generate a browser-compatible geocoder bundle:

```bash
cd scripts/BlackRockCityPlanner
browserify src/geocoder/index.js -o ../../data/2025/geocoder/bundle.js
```

## Directory Structure

```
data/2025/
├── APIData/
│   ├── iBurn2025APIData.swift     # Swift Package target
│   └── Resources/                 # JSON data files
│       ├── art.json              # Art installations
│       ├── camp.json             # Theme camps
│       ├── event.json            # Events and performances
│       ├── points.json           # Points of interest
│       └── update.json           # Update timestamps
├── Map/
│   ├── iBurn2025Map.swift         # Swift Package target
│   └── Resources/                 # Map tiles and styles
│       ├── map.mbtiles           # Vector tiles
│       ├── glyphs/               # Font glyphs
│       └── styles/               # Light/dark map styles
├── MediaFiles/
│   ├── iBurn2025MediaFiles.swift  # Swift Package target
│   └── Resources/                 # Images and media
│       ├── art_images/           # Art installation photos
│       └── camp_images/          # Camp photos
├── geo/                          # Generated GeoJSON files
│   ├── streets.geojson           # Street grid
│   ├── polygons.geojson          # Plazas and districts
│   ├── fence.geojson             # Perimeter fence
│   ├── outline.geojson           # City outline
│   └── toilets.geojson           # Toilet locations
├── layouts/                      # City layout configuration
│   ├── layout.json               # Street positions and bearings
│   └── toilet.json               # Toilet placement specs
└── geocoder/                     # Browser geocoding
    └── bundle.js                 # Geocoder bundle
```

## Address System

Burning Man uses a unique radial addressing system that this project supports:

- **Time-based**: "3:00 & 500'" (clock position + distance from center)
- **Street intersections**: "Esplanade & 6:00" (named street + clock position)
- **Special locations**: "Center Camp Plaza", "9:00 Portal", "Man Base"
- **Distance-based**: "10:30 1200'" (direction with distance)

The BlackRockCityPlanner geocoder handles fuzzy matching and can convert between coordinate systems and human-readable addresses.

## Data Sources

### Official Data
- Burning Man Organization APIs (PlayaEvents API)
- Official camp, art, and event registrations
- Engineering drawings and city layout specifications

### Generated Data
- Street grids and geometric layouts via BlackRockCityPlanner
- Geocoded coordinates for camps, art, and events
- Vector tiles for offline map rendering
- Facility locations (toilets, medical, etc.)

## Development Requirements

### Node.js Tools
- **Node.js 14+** for BlackRockCityPlanner scripts
- **tippecanoe** for vector tile generation
- **browserify** for web bundle creation

### Swift Package Manager
- **Swift 5.5+** for package consumption
- **Xcode 13+** for iOS development

## Key Features

### Offline-First Design
All data is designed to work without network connectivity during the festival, with optional updates when connectivity is available.

### Embargo System
Location data is restricted until Burning Man gates open each year, following official guidelines.

### Multi-Year Support
Historical data is preserved for reference, with each year maintaining its own complete dataset.

### Coordinate System
Custom projection centered on the Man statue, with utilities for converting between coordinate systems.

## Testing

```bash
# Test BlackRockCityPlanner geocoding and generation
cd scripts/BlackRockCityPlanner
npm test

# Test Swift Package
swift test
```

## Data Updates

The app supports remote data updates via CDN:
- Client checks `update.json` for file timestamps
- Downloads only changed files since last update
- Merges new data with existing local database
- Handles both incremental and full dataset updates

## Contributing

1. Follow the established directory structure
2. Update both scripts and documentation for any schema changes
3. Test geocoding accuracy with known coordinates
4. Ensure vector tiles render correctly at all zoom levels
5. Maintain backward compatibility for existing data consumers

## License

This project contains data and code for the iBurn application ecosystem. Please respect Burning Man's intellectual property and the festival's principles when using this data.
