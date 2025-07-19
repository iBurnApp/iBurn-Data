# Map Tiles Regeneration with Official BMorg Data - 2025-07-19

## High-Level Plan
**Problem Statement**: Need to regenerate map tiles using official Burning Man Organization GIS data instead of generated geometric data.

**Solution Overview**: Replace tippecanoe command to use official 2025 BMorg data from `/bmorg/innovate-GIS-data/2025/GeoJSON/` with relative paths for easier maintenance.

**Key Changes**:
- Use official CPNs (Critical Public Needs) instead of generated points
- Update file paths to point to actual BMorg data sources  
- Use relative paths from `data/2025/` directory
- Preserve generated data only for unavailable layers (toilets, DMZ)

## Technical Details

### Files Modified
- `/Users/chrisbal/Documents/Code/iBurn-iOS/Submodules/iBurn-Data/README.md:75-86` - Updated tippecanoe command
- `/Users/chrisbal/Documents/Code/iBurn-iOS/Submodules/iBurn-Data/data/2025/Map/Map.bundle/map.mbtiles` - Generated new tiles

### Official Data Mapping
```
Official BMorg Data → Tippecanoe Layers:
- trash_fence.geojson → -L fence
- street_outlines.geojson → -L outline  
- city_blocks.geojson → -L blocks
- plazas.geojson → -L plazas
- street_lines.geojson → -L streets
- cpns.geojson → -L points (Critical Public Needs)

Fallback Generated Data:
- geo/toilets.geojson → -L toilets (not in official data)
- geo/dmz.geojson → -L dmz (not in official data)
```

### Updated Command
```bash
# Execute from data/2025/ directory
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

### Command Output
```
Read 0.00 million features
1009 features, 87820 bytes of geometry and attributes, 5430 bytes of string pool
Generated tiles from zoom levels 4-14
Final file size: 274,432 bytes (268 KB)
```

## Context Preservation

### Available Official Data
Found in `/bmorg/innovate-GIS-data/2025/GeoJSON/`:
- `city_blocks.geojson` - City block boundaries
- `cpns.geojson` - Critical Public Needs points  
- `plazas.geojson` - Plaza areas
- `street_lines.geojson` - Street centerlines
- `street_outlines.geojson` - Street boundaries
- `trash_fence.geojson` - Perimeter fence

### Missing from Official Data
- DMZ boundaries - using generated `geo/dmz.geojson`
- Toilet locations - using generated `geo/toilets.geojson`

### Decision Rationale
- **CPNs vs Points**: Official CPNs provide authoritative point-of-interest data from BMorg
- **Relative Paths**: Easier maintenance when updating README.md documentation
- **Mixed Sources**: Use official data where available, fall back to generated for missing layers
- **Bundle Structure**: Maintain existing `Map.bundle/map.mbtiles` path for iOS app compatibility

### Dependencies
- tippecanoe installed via homebrew (`/opt/homebrew/bin/tippecanoe`)
- Official BMorg data available at `../../bmorg/innovate-GIS-data/2025/GeoJSON/`
- Generated fallback data at `geo/toilets.geojson` and `geo/dmz.geojson`

## Expected Outcomes

### What Should Work After Implementation
- ✅ New vector tiles use official BMorg geometry for primary city features
- ✅ Map rendering continues with existing styles and sprites 
- ✅ Documentation updated with correct command for future use
- ✅ Relative paths make README.md easier to maintain across years

### Cross-References
- Related to iOS app map rendering in main iBurn project
- Connects to BlackRockCityPlanner geodata generation workflow
- Part of 2025 data preparation process

### Completion Status
**✅ COMPLETED** - All tasks successfully implemented:
1. ✅ Verified tippecanoe installation  
2. ✅ Generated new tiles with official data (1009 features processed)
3. ✅ Updated README.md with new command using relative paths
4. ✅ Verified new map.mbtiles file created (268 KB, Jul 19 16:03)

### Remaining Work
None - implementation complete and documented.