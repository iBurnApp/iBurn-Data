# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iBurn-Data is a data repository containing yearly festival datasets, geospatial data, and processing scripts for the iBurn iOS app. This repository serves as a submodule providing offline map tiles, art installation data, camp information, events, and Black Rock City layout geometry for Burning Man festivals.

## Development Commands

### Data Generation Workflow
```bash
# Navigate to BlackRockCityPlanner for geometry generation
cd scripts/BlackRockCityPlanner

# Install dependencies
npm install

# Generate all geometric data for a year
node src/cli/generate_all.js -d ../../data/2024

# Geocode API data with coordinates
node src/cli/api.js -l ../../data/2024/layouts/layout.json -f ../../data/2024/APIData/camp.json -k location_string -o ../../data/2024/APIData/camp-location.json

# Update original with geocoded version
mv ../../data/2024/APIData/camp-location.json ../../data/2024/APIData/camp.json

# Generate browser geocoder bundle
browserify src/geocoder/index.js -o ../../data/2024/geocoder/bundle.js
```

### Testing
```bash
cd scripts/BlackRockCityPlanner
npm test  # Run Node.js geospatial generation tests
```

## Data Architecture

### Yearly Data Structure
Each year follows this directory pattern:
```
data/YYYY/
├── APIData/           # JSON data files from Burning Man APIs
│   ├── art.json      # Art installations with descriptions/locations
│   ├── camp.json     # Theme camps with coordinates
│   ├── event.json    # Scheduled events and performances  
│   ├── points.json   # Points of interest (toilets, medical, etc.)
│   └── update.json   # Data versioning and update timestamps
├── geo/              # GeoJSON geometric data
│   ├── streets.geojson     # Street grid (radial time-based + concentric)
│   ├── polygons.geojson    # Plazas and city districts
│   ├── fence.geojson       # Perimeter boundary
│   ├── outline.geojson     # Overall city outline
│   └── toilets.geojson     # Toilet facilities placement
├── layouts/          # City layout configuration
│   ├── layout.json         # Street positions, bearings, center coordinates
│   └── toilet.json         # Toilet placement specifications
├── Map/              # MapLibre map tiles and styling
│   ├── map.mbtiles         # Offline vector tiles
│   └── styles/             # Light/dark map styles (JSON)
└── MediaFiles/       # Images and audio files for art/camps
```

### Key Data Processing

**BlackRockCityPlanner Scripts**
- **Geometry Generation**: Creates radial street grid based on Burning Man's unique time-based addressing (12:00, 1:00, etc.)
- **Geocoding**: Converts human-readable addresses to coordinates using fuzzy matching
- **GeoJSON Output**: Produces vector geometry for streets, plazas, facilities

**Address System**: Burning Man uses unique addressing:
- Time-based radial: "3:00 & 500'" (clock position + distance)  
- Named intersections: "Esplanade & 6:00"
- Special locations: "Center Camp Plaza", "Man Base"

### Data Sources and Pipeline

**Input Sources**
- Burning Man Organization APIs (official camp/art/event data)
- City layout specifications (engineering drawings → JSON)
- Historical data archives for reference years

**Processing Pipeline**
1. **Layout Definition**: JSON configuration defines city geometry parameters
2. **Grid Generation**: Creates time-based radial streets and concentric roads
3. **API Enhancement**: Adds coordinates to camp/art/event records via geocoding
4. **GeoJSON Export**: Outputs vector data for map rendering
5. **Tile Generation**: Creates offline MBTiles for mobile consumption

### Dependencies and Tools

**Node.js Ecosystem** (in BlackRockCityPlanner)
- **Turf.js v3.x**: Geospatial operations and coordinate transformations
- **JSTS**: Advanced geometric calculations
- **Browserify**: Bundle geocoder for web usage

**Data Formats**
- **Input**: JSON layout files, CSV exports, XML data feeds
- **Output**: GeoJSON features, enhanced JSON with coordinates, MBTiles

### File Organization Notes
- `/data/YYYY/` - Year-specific festival data (2012-2024+)
- `/scripts/BlackRockCityPlanner/` - Node.js data processing tools (git submodule)
- `/scripts/archive/` - Legacy Python processing scripts (pre-2015)
- Historical progression: Python scripts → Node.js workflow → current architecture

### Important Workflow Considerations
- Data embargo: Location data restricted until Burning Man gates open each year
- Coordinate system: Custom projection centered on the Man statue
- Address parsing: Requires fuzzy matching for user-generated location strings
- Offline-first: All data must work without network connectivity during festival