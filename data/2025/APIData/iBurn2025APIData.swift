import Foundation

/// Burning Man 2025 API Data
/// 
/// This module provides access to Burning Man 2025 API data including:
/// - art.json: Art installations and sculptures
/// - camp.json: Camps and theme camps
/// - event.json: Events and activities
/// - update.json: Data update information
/// - credits.json: Data credits and attribution
/// - dates_info.json: Event dates and schedule information
/// - points.json: Point of interest data
///
/// Access the JSON files through Bundle.module:
/// ```swift
/// import iBurn2025APIData
/// 
/// guard let url = Bundle.module.url(forResource: "art", withExtension: "json") else {
///     fatalError("Could not find art.json")
/// }
/// let data = try Data(contentsOf: url)
/// ```
public enum iBurn2025APIData {
    /// The current year for this data package
    public static let year = 2025
    
    /// The bundle containing the 2025 API data resources
    public static let bundle: Bundle = {
        return Bundle.module
    }()
    
    /// Available JSON data files
    public enum DataFile: String, CaseIterable {
        case art = "art"
        case camp = "camp"
        case event = "event"
        case update = "update"
        case credits = "credits"
        case datesInfo = "dates_info"
        case points = "points"
        
        /// Get the URL for this data file from the bundle
        public var url: URL? {
            iBurn2025APIData.bundle.url(forResource: rawValue, withExtension: "json")
        }
        
        /// Load the data for this file
        public func loadData() throws -> Data {
            guard let url = self.url else {
                throw DataError.fileNotFound(rawValue + ".json")
            }
            return try Data(contentsOf: url)
        }
    }
}

/// Errors that can occur when loading data
public enum DataError: Error, LocalizedError {
    case fileNotFound(String)
    
    public var errorDescription: String? {
        switch self {
        case .fileNotFound(let filename):
            return "Data file not found: \(filename)"
        }
    }
}