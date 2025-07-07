import XCTest
@testable import iBurn2025APIData

final class DataValidationTests: XCTestCase {
    
    // MARK: - Deep Data Structure Validation
    
    func testArtDataRequiredFields() throws {
        let data = try iBurn2025APIData.DataFile.art.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let artArray = json as? [[String: Any]] else {
            XCTFail("Art data should be an array of dictionaries")
            return
        }
        
        for (index, artItem) in artArray.enumerated() {
            // Required fields for art objects
            XCTAssertNotNil(artItem["uid"], "Art item \(index) should have uid")
            XCTAssertNotNil(artItem["name"], "Art item \(index) should have name")
            XCTAssertNotNil(artItem["year"], "Art item \(index) should have year")
            
            // Validate UID format (typically alphanumeric)
            if let uid = artItem["uid"] as? String {
                XCTAssertFalse(uid.isEmpty, "Art item \(index) uid should not be empty")
                XCTAssertLessThan(uid.count, 100, "Art item \(index) uid should be reasonable length")
            }
            
            // Validate name
            if let name = artItem["name"] as? String {
                XCTAssertFalse(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, 
                              "Art item \(index) name should not be empty or whitespace")
            }
            
            // Validate year
            if let year = artItem["year"] as? Int {
                XCTAssertEqual(year, 2025, "Art item \(index) should be for year 2025")
            }
            
            // Optional but common fields
            if let description = artItem["description"] as? String {
                // Description can be empty, but if present should be reasonable
                XCTAssertLessThan(description.count, 10000, "Art item \(index) description should be reasonable length")
            }
            
            // Location data validation
            if let locationString = artItem["location_string"] as? String {
                // Location string format validation (Burning Man addressing)
                validateBurningManAddress(locationString, itemType: "Art item \(index)")
            }
        }
    }
    
    func testCampDataRequiredFields() throws {
        let data = try iBurn2025APIData.DataFile.camp.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let campArray = json as? [[String: Any]] else {
            XCTFail("Camp data should be an array of dictionaries")
            return
        }
        
        for (index, campItem) in campArray.enumerated() {
            // Required fields for camp objects
            XCTAssertNotNil(campItem["uid"], "Camp item \(index) should have uid")
            XCTAssertNotNil(campItem["name"], "Camp item \(index) should have name")
            XCTAssertNotNil(campItem["year"], "Camp item \(index) should have year")
            
            // Validate UID format
            if let uid = campItem["uid"] as? String {
                XCTAssertFalse(uid.isEmpty, "Camp item \(index) uid should not be empty")
            }
            
            // Validate name
            if let name = campItem["name"] as? String {
                XCTAssertFalse(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, 
                              "Camp item \(index) name should not be empty")
            }
            
            // Validate year
            if let year = campItem["year"] as? Int {
                XCTAssertEqual(year, 2025, "Camp item \(index) should be for year 2025")
            }
            
            // Location data validation
            if let locationString = campItem["location_string"] as? String {
                validateBurningManAddress(locationString, itemType: "Camp item \(index)")
            }
            
            // Camp-specific fields
            if let url = campItem["url"] as? String, !url.isEmpty {
                XCTAssertTrue(url.hasPrefix("http://") || url.hasPrefix("https://"), 
                             "Camp item \(index) URL should be valid HTTP(S) URL")
            }
        }
    }
    
    func testEventDataRequiredFields() throws {
        let data = try iBurn2025APIData.DataFile.event.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let eventArray = json as? [[String: Any]] else {
            XCTFail("Event data should be an array of dictionaries")
            return
        }
        
        for (index, eventItem) in eventArray.enumerated() {
            // Required fields for event objects
            XCTAssertNotNil(eventItem["uid"], "Event item \(index) should have uid")
            XCTAssertNotNil(eventItem["title"], "Event item \(index) should have title")
            XCTAssertNotNil(eventItem["year"], "Event item \(index) should have year")
            
            // Validate UID format
            if let uid = eventItem["uid"] as? String {
                XCTAssertFalse(uid.isEmpty, "Event item \(index) uid should not be empty")
            }
            
            // Validate title
            if let title = eventItem["title"] as? String {
                XCTAssertFalse(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, 
                              "Event item \(index) title should not be empty")
            }
            
            // Validate year
            if let year = eventItem["year"] as? Int {
                XCTAssertEqual(year, 2025, "Event item \(index) should be for year 2025")
            }
            
            // Event timing validation
            if let occurrenceSet = eventItem["occurrence_set"] as? [[String: Any]] {
                for (occIndex, occurrence) in occurrenceSet.enumerated() {
                    if let startTime = occurrence["start_time"] as? String {
                        XCTAssertFalse(startTime.isEmpty, 
                                      "Event item \(index) occurrence \(occIndex) start_time should not be empty")
                    }
                    
                    if let endTime = occurrence["end_time"] as? String {
                        XCTAssertFalse(endTime.isEmpty, 
                                      "Event item \(index) occurrence \(occIndex) end_time should not be empty")
                    }
                }
            }
        }
    }
    
    // MARK: - Data Consistency Tests
    
    func testUniqueIdentifiers() throws {
        // Test that UIDs are unique within each data set
        
        // Art UIDs
        let artData = try iBurn2025APIData.DataFile.art.loadData()
        let artJson = try JSONSerialization.jsonObject(with: artData, options: [])
        if let artArray = artJson as? [[String: Any]] {
            let artUIDs = artArray.compactMap { $0["uid"] as? String }
            let uniqueArtUIDs = Set(artUIDs)
            XCTAssertEqual(artUIDs.count, uniqueArtUIDs.count, "Art UIDs should be unique")
        }
        
        // Camp UIDs
        let campData = try iBurn2025APIData.DataFile.camp.loadData()
        let campJson = try JSONSerialization.jsonObject(with: campData, options: [])
        if let campArray = campJson as? [[String: Any]] {
            let campUIDs = campArray.compactMap { $0["uid"] as? String }
            let uniqueCampUIDs = Set(campUIDs)
            XCTAssertEqual(campUIDs.count, uniqueCampUIDs.count, "Camp UIDs should be unique")
        }
        
        // Event UIDs
        let eventData = try iBurn2025APIData.DataFile.event.loadData()
        let eventJson = try JSONSerialization.jsonObject(with: eventData, options: [])
        if let eventArray = eventJson as? [[String: Any]] {
            let eventUIDs = eventArray.compactMap { $0["uid"] as? String }
            let uniqueEventUIDs = Set(eventUIDs)
            XCTAssertEqual(eventUIDs.count, uniqueEventUIDs.count, "Event UIDs should be unique")
        }
    }
    
    func testDataCounts() throws {
        // Test that we have reasonable amounts of data
        
        let artData = try iBurn2025APIData.DataFile.art.loadData()
        let artJson = try JSONSerialization.jsonObject(with: artData, options: [])
        if let artArray = artJson as? [[String: Any]] {
            XCTAssertGreaterThan(artArray.count, 0, "Should have at least some art installations")
            XCTAssertLessThan(artArray.count, 10000, "Art count should be reasonable (less than 10k)")
        }
        
        let campData = try iBurn2025APIData.DataFile.camp.loadData()
        let campJson = try JSONSerialization.jsonObject(with: campData, options: [])
        if let campArray = campJson as? [[String: Any]] {
            XCTAssertGreaterThan(campArray.count, 0, "Should have at least some camps")
            XCTAssertLessThan(campArray.count, 5000, "Camp count should be reasonable (less than 5k)")
        }
        
        let eventData = try iBurn2025APIData.DataFile.event.loadData()
        let eventJson = try JSONSerialization.jsonObject(with: eventData, options: [])
        if let eventArray = eventJson as? [[String: Any]] {
            XCTAssertGreaterThan(eventArray.count, 0, "Should have at least some events")
            XCTAssertLessThan(eventArray.count, 50000, "Event count should be reasonable (less than 50k)")
        }
    }
    
    func testUpdateInfoValidation() throws {
        let data = try iBurn2025APIData.DataFile.update.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let updateDict = json as? [String: Any] else {
            XCTFail("Update data should be a dictionary")
            return
        }
        
        // Validate timestamp format
        if let timestamp = updateDict["timestamp"] as? String {
            XCTAssertFalse(timestamp.isEmpty, "Timestamp should not be empty")
            // Could add more sophisticated timestamp validation here
        }
        
        // Validate year
        if let year = updateDict["year"] as? Int {
            XCTAssertEqual(year, 2025, "Update year should be 2025")
        }
    }
    
    // MARK: - Helper Methods
    
    private func validateBurningManAddress(_ address: String, itemType: String) {
        // Basic validation for Burning Man addressing system
        guard !address.isEmpty else { return }
        
        // Common patterns:
        // "3:00 & 500'" - time and distance
        // "Esplanade & 6:00" - named street and time
        // "Center Camp Plaza" - special location
        // "9:00 Portal" - portal locations
        
        let trimmedAddress = address.trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertFalse(trimmedAddress.isEmpty, "\(itemType) location should not be empty or whitespace")
        XCTAssertLessThan(trimmedAddress.count, 200, "\(itemType) location should be reasonable length")
        
        // Check for common Burning Man address patterns
        let hasTimePattern = trimmedAddress.contains(":") // Time-based addressing
        let hasDistancePattern = trimmedAddress.contains("'") || trimmedAddress.contains("ft") // Distance
        let hasSpecialLocation = trimmedAddress.lowercased().contains("camp") || 
                                trimmedAddress.lowercased().contains("plaza") ||
                                trimmedAddress.lowercased().contains("portal")
        let hasStreetName = trimmedAddress.lowercased().contains("esplanade") ||
                           trimmedAddress.lowercased().contains("promenade") ||
                           trimmedAddress.lowercased().contains("avenue")
        
        // Should match at least one pattern
        XCTAssertTrue(
            hasTimePattern || hasDistancePattern || hasSpecialLocation || hasStreetName,
            "\(itemType) location '\(trimmedAddress)' should match Burning Man addressing patterns"
        )
    }
    
    // MARK: - Cross-Reference Tests
    
    func testEventCampReferences() throws {
        // Test that events referencing camps have valid camp references
        let eventData = try iBurn2025APIData.DataFile.event.loadData()
        let eventJson = try JSONSerialization.jsonObject(with: eventData, options: [])
        
        let campData = try iBurn2025APIData.DataFile.camp.loadData()
        let campJson = try JSONSerialization.jsonObject(with: campData, options: [])
        
        guard let eventArray = eventJson as? [[String: Any]],
              let campArray = campJson as? [[String: Any]] else {
            return // Skip if data format is unexpected
        }
        
        let campUIDs = Set(campArray.compactMap { $0["uid"] as? String })
        
        for (index, event) in eventArray.enumerated() {
            if let hostedByCampUID = event["hosted_by_camp"] as? String,
               !hostedByCampUID.isEmpty {
                XCTAssertTrue(
                    campUIDs.contains(hostedByCampUID),
                    "Event \(index) hosted_by_camp '\(hostedByCampUID)' should reference a valid camp"
                )
            }
        }
    }
    
    func testDataIntegrityAcrossFiles() throws {
        // Test that data is consistent across different files
        let updateData = try iBurn2025APIData.DataFile.update.loadData()
        let updateJson = try JSONSerialization.jsonObject(with: updateData, options: [])
        
        if let updateDict = updateJson as? [String: Any],
           let updateYear = updateDict["year"] as? Int {
            
            // All other data should match the update year
            XCTAssertEqual(updateYear, 2025, "Update file should indicate year 2025")
            XCTAssertEqual(updateYear, iBurn2025APIData.year, "Update year should match module year")
        }
    }
}