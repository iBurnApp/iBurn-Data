import Foundation

/// Burning Man 2025 Media Files
/// 
/// This module provides access to Burning Man 2025 media resources including:
/// - Art installation images
/// - Camp photos  
/// - Event media files
/// - Audio content
///
/// Note: Media files for 2025 may be populated as the event approaches.
/// Currently this directory contains placeholder files (.gitkeep).
///
/// Access media files through Bundle.module:
/// ```swift
/// import iBurn2025MediaFiles
/// 
/// // Future usage when media files are available:
/// // guard let imageURL = Bundle.module.url(forResource: "artUID", withExtension: "jpg") else {
/// //     // Handle missing media file
/// //     return
/// // }
/// ```
public enum iBurn2025MediaFiles {
    /// The current year for this media data
    public static let year = 2025
    
    /// Get URL for a media file by name
    /// - Parameters:
    ///   - name: The filename without extension
    ///   - extension: The file extension (e.g., "jpg", "png", "m4a")
    /// - Returns: URL to the media file, or nil if not found
    public static func url(forResource name: String, withExtension ext: String?) -> URL? {
        Bundle.module.url(forResource: name, withExtension: ext)
    }
    
    /// Get all available media files in the bundle
    /// - Returns: Array of URLs to available media files
    public static func allMediaFiles() -> [URL] {
        guard let resourceURL = Bundle.module.resourceURL else { return [] }
        
        do {
            let contents = try FileManager.default.contentsOfDirectory(
                at: resourceURL,
                includingPropertiesForKeys: [URLResourceKey.isRegularFileKey],
                options: [.skipsHiddenFiles, .skipsSubdirectoryDescendants]
            )
            
            return contents.filter { url in
                guard let resourceValues = try? url.resourceValues(forKeys: [URLResourceKey.isRegularFileKey]),
                      let isRegularFile = resourceValues.isRegularFile else {
                    return false
                }
                return isRegularFile && !url.lastPathComponent.hasPrefix(".")
            }
        } catch {
            return []
        }
    }
}