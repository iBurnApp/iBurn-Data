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
    
    /// Available map resource files
    public enum MapResource: String, CaseIterable {
        case mbtiles = "Resources/map.mbtiles"
        case darkStyle = "Resources/styles/iburn-dark.json"
        case lightStyle = "Resources/styles/iburn-light.json"
        case spriteJson = "Resources/sprites/sprite.json"
        case sprite2x = "Resources/sprites/sprite@2x.png"
        
        /// Get the URL for this map resource from the bundle
        public var url: URL? {
            let components = rawValue.split(separator: "/")
            if components.count == 2 {
                return Bundle.module.url(forResource: String(components[1]).replacingOccurrences(of: ".json", with: "").replacingOccurrences(of: ".png", with: "").replacingOccurrences(of: ".mbtiles", with: ""), 
                                       withExtension: String(components[1]).split(separator: ".").last.map(String.init),
                                       subdirectory: String(components[0]))
            } else {
                let filename = String(components[0])
                let nameWithoutExt = filename.replacingOccurrences(of: ".mbtiles", with: "")
                let ext = filename.split(separator: ".").last.map(String.init)
                return Bundle.module.url(forResource: nameWithoutExt, withExtension: ext)
            }
        }
        
        /// Get the directory URL for glyphs
        public static var glyphsDirectory: URL? {
            Bundle.module.url(forResource: "glyphs", withExtension: nil as String?, subdirectory: "Resources")
        }
    }
}