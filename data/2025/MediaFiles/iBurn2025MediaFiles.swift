import Foundation

/// Burning Man 2025 Media Files
/// 
/// This module provides access to Burning Man 2025 media files including:
/// - Images for art installations, camps, and events
/// - Audio files and other media content
///
/// Access the media files through Bundle.module:
/// ```swift
/// import iBurn2025MediaFiles
/// 
/// guard let url = Bundle.module.url(forResource: "a1XVI000008yf262AA", withExtension: "jpg", subdirectory: "Resources") else {
///     fatalError("Could not find image file")
/// }
/// let imageData = try Data(contentsOf: url)
/// ```
public enum iBurn2025MediaFiles {
    /// The current year for this media package
    public static let year = 2025
    
    /// The bundle containing the 2025 media file resources
    public static let bundle: Bundle = {
        return Bundle.module
    }()
    
    /// Load image data for a given file ID
    /// - Parameter fileId: The file ID (without extension)
    /// - Returns: Image data if the file exists
    public static func loadImageData(fileId: String) -> Data? {
        guard let url = bundle.url(forResource: fileId, withExtension: "jpg", subdirectory: "Resources") else {
            return nil
        }
        return try? Data(contentsOf: url)
    }
    
    /// Get URL for a media file
    /// - Parameters:
    ///   - fileId: The file ID (without extension)
    ///   - extension: The file extension (default: "jpg")
    /// - Returns: URL to the media file if it exists
    public static func url(forResource fileId: String, withExtension ext: String = "jpg") -> URL? {
        return bundle.url(forResource: fileId, withExtension: ext, subdirectory: "Resources")
    }
    
    /// Get all available media files in the Resources subdirectory
    /// - Returns: Array of URLs to available media files
    public static func allMediaFiles() -> [URL] {
        guard let mediaFilesURL = bundle.url(forResource: "Resources", withExtension: nil) else { 
            return [] 
        }
        
        do {
            let contents = try FileManager.default.contentsOfDirectory(
                at: mediaFilesURL,
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

/// Errors that can occur when loading media files
public enum MediaFileError: Error, LocalizedError {
    case fileNotFound(String)
    case loadingFailed(String)
    
    public var errorDescription: String? {
        switch self {
        case .fileNotFound(let filename):
            return "Media file not found: \(filename)"
        case .loadingFailed(let filename):
            return "Failed to load media file: \(filename)"
        }
    }
}