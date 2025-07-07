import XCTest
@testable import iBurn2025APIData

final class iBurn2025APIDataTests: XCTestCase {
    
    // MARK: - Basic Resource Existence Tests
    
    func testDataFilesExist() {
        for dataFile in iBurn2025APIData.DataFile.allCases {
            XCTAssertNotNil(
                dataFile.url,
                "Data file \(dataFile.rawValue).json should exist in bundle"
            )
        }
    }
    
    func testDataFilesCanBeLoaded() {
        for dataFile in iBurn2025APIData.DataFile.allCases {
            XCTAssertNoThrow(
                try dataFile.loadData(),
                "Should be able to load data for \(dataFile.rawValue).json"
            )
        }
    }
    
    func testBundleExists() {
        XCTAssertNotNil(iBurn2025APIData.bundle)
        XCTAssertNotNil(iBurn2025APIData.bundle.resourceURL)
    }
    
    func testYearConstant() {
        XCTAssertEqual(iBurn2025APIData.year, 2025)
    }
    
    // MARK: - JSON Structure Validation Tests
    
    func testArtDataStructure() throws {
        let data = try iBurn2025APIData.DataFile.art.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let artArray = json as? [[String: Any]] else {
            XCTFail("Art data should be an array of dictionaries")
            return
        }
        
        XCTAssertFalse(artArray.isEmpty, "Art data should not be empty")
        
        // Check first art item has required fields
        if let firstArt = artArray.first {
            XCTAssertNotNil(firstArt["uid"], "Art item should have uid")
            XCTAssertNotNil(firstArt["name"], "Art item should have name")
            XCTAssertNotNil(firstArt["year"], "Art item should have year")
        }
    }
    
    func testCampDataStructure() throws {
        let data = try iBurn2025APIData.DataFile.camp.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let campArray = json as? [[String: Any]] else {
            XCTFail("Camp data should be an array of dictionaries")
            return
        }
        
        XCTAssertFalse(campArray.isEmpty, "Camp data should not be empty")
        
        // Check first camp item has required fields
        if let firstCamp = campArray.first {
            XCTAssertNotNil(firstCamp["uid"], "Camp item should have uid")
            XCTAssertNotNil(firstCamp["name"], "Camp item should have name")
            XCTAssertNotNil(firstCamp["year"], "Camp item should have year")
        }
    }
    
    func testEventDataStructure() throws {
        let data = try iBurn2025APIData.DataFile.event.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let eventArray = json as? [[String: Any]] else {
            XCTFail("Event data should be an array of dictionaries")
            return
        }
        
        XCTAssertFalse(eventArray.isEmpty, "Event data should not be empty")
        
        // Check first event item has required fields
        if let firstEvent = eventArray.first {
            XCTAssertNotNil(firstEvent["uid"], "Event item should have uid")
            XCTAssertNotNil(firstEvent["title"], "Event item should have title")
            XCTAssertNotNil(firstEvent["year"], "Event item should have year")
        }
    }
    
    func testUpdateDataStructure() throws {
        let data = try iBurn2025APIData.DataFile.update.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let updateDict = json as? [String: Any] else {
            XCTFail("Update data should be a dictionary")
            return
        }
        
        XCTAssertNotNil(updateDict["timestamp"], "Update data should have timestamp")
        XCTAssertNotNil(updateDict["year"], "Update data should have year")
    }
    
    func testCreditsDataStructure() throws {
        let data = try iBurn2025APIData.DataFile.credits.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let creditsDict = json as? [String: Any] else {
            XCTFail("Credits data should be a dictionary")
            return
        }
        
        XCTAssertNotNil(creditsDict["data_sources"], "Credits should have data_sources")
    }
    
    func testDatesInfoStructure() throws {
        let data = try iBurn2025APIData.DataFile.datesInfo.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        guard let datesDict = json as? [String: Any] else {
            XCTFail("Dates info should be a dictionary")
            return
        }
        
        XCTAssertNotNil(datesDict["year"], "Dates info should have year")
    }
    
    func testPointsDataStructure() throws {
        let data = try iBurn2025APIData.DataFile.points.loadData()
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        
        // Points can be either array or dictionary depending on content
        XCTAssertTrue(
            json is [[String: Any]] || json is [String: Any],
            "Points data should be either array or dictionary"
        )
    }
    
    // MARK: - Data Validation Tests
    
    func testDataIntegrity() throws {
        // Test that all data files have valid JSON
        for dataFile in iBurn2025APIData.DataFile.allCases {
            let data = try dataFile.loadData()
            XCTAssertNoThrow(
                try JSONSerialization.jsonObject(with: data, options: []),
                "Data file \(dataFile.rawValue).json should contain valid JSON"
            )
        }
    }
    
    func testDataSizes() throws {
        // Ensure data files are not empty (basic sanity check)
        for dataFile in iBurn2025APIData.DataFile.allCases {
            let data = try dataFile.loadData()
            XCTAssertGreaterThan(
                data.count,
                10,
                "Data file \(dataFile.rawValue).json should not be empty"
            )
        }
    }
    
    func testYearConsistency() throws {
        let artData = try iBurn2025APIData.DataFile.art.loadData()
        let artJson = try JSONSerialization.jsonObject(with: artData, options: [])
        
        if let artArray = artJson as? [[String: Any]],
           let firstArt = artArray.first,
           let year = firstArt["year"] as? Int {
            XCTAssertEqual(year, 2025, "Art data should be for year 2025")
        }
        
        let campData = try iBurn2025APIData.DataFile.camp.loadData()
        let campJson = try JSONSerialization.jsonObject(with: campData, options: [])
        
        if let campArray = campJson as? [[String: Any]],
           let firstCamp = campArray.first,
           let year = firstCamp["year"] as? Int {
            XCTAssertEqual(year, 2025, "Camp data should be for year 2025")
        }
        
        let eventData = try iBurn2025APIData.DataFile.event.loadData()
        let eventJson = try JSONSerialization.jsonObject(with: eventData, options: [])
        
        if let eventArray = eventJson as? [[String: Any]],
           let firstEvent = eventArray.first,
           let year = firstEvent["year"] as? Int {
            XCTAssertEqual(year, 2025, "Event data should be for year 2025")
        }
    }
    
    // MARK: - Error Handling Tests
    
    func testErrorHandling() {
        // Test that DataError properly describes missing files
        let error = DataError.fileNotFound("missing.json")
        XCTAssertEqual(error.errorDescription, "Data file not found: missing.json")
    }
    
    func testDataFileURLGeneration() {
        for dataFile in iBurn2025APIData.DataFile.allCases {
            let url = dataFile.url
            XCTAssertNotNil(url, "Should generate URL for \(dataFile.rawValue)")
            
            if let url = url {
                XCTAssertTrue(
                    url.lastPathComponent.contains(dataFile.rawValue),
                    "URL should contain the data file name"
                )
                XCTAssertTrue(
                    url.pathExtension == "json",
                    "URL should have .json extension"
                )
            }
        }
    }
    
    // MARK: - Performance Tests
    
    func testLoadingPerformance() {
        measure {
            for dataFile in iBurn2025APIData.DataFile.allCases {
                do {
                    _ = try dataFile.loadData()
                } catch {
                    XCTFail("Failed to load \(dataFile.rawValue): \(error)")
                }
            }
        }
    }
    
    func testJSONParsingPerformance() {
        measure {
            for dataFile in iBurn2025APIData.DataFile.allCases {
                do {
                    let data = try dataFile.loadData()
                    _ = try JSONSerialization.jsonObject(with: data, options: [])
                } catch {
                    XCTFail("Failed to parse \(dataFile.rawValue): \(error)")
                }
            }
        }
    }
}