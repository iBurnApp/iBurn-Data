import Foundation

/// Burning Man 2025 Map Data
/// 
/// This module provides access to Burning Man 2025 offline map resources including:
/// - map.mbtiles: Offline map tiles in MBTiles format
/// - glyphs/: Font glyphs for map text rendering
/// - sprites/: Map icons and symbols
/// - styles/: MapLibre style definitions (iburn-dark.json, iburn-light.json)
///
/// Access the map resources through Bundle.module:
/// ```swift
/// import iBurn2025Map
/// 
/// guard let mbtilesURL = iBurn2025Map.MapResource.mbtiles.url else {
///     fatalError("Could not find map.mbtiles")
/// }
/// ```
public enum iBurn2025Map {
    /// The current year for this map data
    public static let year = 2025
    
    /// The bundle containing the 2025 map resources
    public static let bundle: Bundle = {
        guard let bundleURL = Bundle.module.url(forResource: "Map", withExtension: "bundle"),
              let bundle = Bundle(url: bundleURL) else {
            fatalError("Could not load Map.bundle")
        }
        return bundle
    }()
    
    /// Available map resource files
    public enum MapResource: String, CaseIterable {
        case mbtiles = "map.mbtiles"
        case darkStyle = "styles/iburn-dark.json"
        case lightStyle = "styles/iburn-light.json"
        case spriteJson = "sprites/sprite.json"
        case sprite2x = "sprites/sprite@2x.png"
        
        /// Get the URL for this map resource from the bundle
        public var url: URL? {
            let components = rawValue.split(separator: "/")
            if components.count == 2 {
                // File in subdirectory
                let subdirectory = String(components[0])
                let filename = String(components[1])
                let nameWithoutExt = filename.components(separatedBy: ".").dropLast().joined(separator: ".")
                let ext = filename.components(separatedBy: ".").last
                return iBurn2025Map.bundle.url(forResource: nameWithoutExt, withExtension: ext, subdirectory: subdirectory)
            } else {
                // File in root
                let filename = String(components[0])
                let nameWithoutExt = filename.components(separatedBy: ".").dropLast().joined(separator: ".")
                let ext = filename.components(separatedBy: ".").last
                return iBurn2025Map.bundle.url(forResource: nameWithoutExt, withExtension: ext)
            }
        }
        
        /// Get the directory URL for glyphs
        public static var glyphsDirectory: URL? {
            iBurn2025Map.bundle.url(forResource: "glyphs", withExtension: nil)
        }
    }
}